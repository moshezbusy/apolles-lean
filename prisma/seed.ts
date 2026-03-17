import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { PrismaClient, Role } from "@prisma/client";

type SeedPasswordKey = "SEED_ADMIN_PASSWORD" | "SEED_AGENT_PASSWORD";

type SeedLogger = Pick<typeof console, "log" | "error">;

type BcryptLike = Pick<typeof bcrypt, "compare" | "hash">;

type SeedDbClient = Pick<PrismaClient, "$disconnect" | "platformSetting" | "user">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isMissingTableError(error: unknown, tableName: string) {
  if (!isRecord(error)) {
    return false;
  }

  const code = error.code;
  const meta = error.meta;
  const message = error.message;

  const normalizedTableName = tableName.toLowerCase();
  const metaTableName =
    isRecord(meta) && typeof meta.table === "string" ? meta.table.toLowerCase() : undefined;

  return (
    code === "P2021" &&
    ((typeof metaTableName === "string" && metaTableName.includes(normalizedTableName)) ||
      (typeof message === "string" && message.toLowerCase().includes(normalizedTableName)))
  );
}

export function getSeedDatabaseUrl(
  baseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL,
) {
  if (!baseUrl) {
    return undefined;
  }

  const databaseUrl = new URL(baseUrl);

  const usesPooler = databaseUrl.searchParams.get("pgbouncer") === "true" || databaseUrl.port === "6543";

  if (!usesPooler) {
    return databaseUrl.toString();
  }

  databaseUrl.searchParams.set("pgbouncer", "true");

  if (!databaseUrl.searchParams.has("connection_limit")) {
    databaseUrl.searchParams.set("connection_limit", "1");
  }

  return databaseUrl.toString();
}

export function createSeedPrismaClient(databaseUrl = getSeedDatabaseUrl()) {
  return new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined,
  );
}

export function getSeedPassword(
  envKey: SeedPasswordKey,
  fallback: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const value = env[envKey]?.trim();

  if (value) {
    return value;
  }

  const canUseInsecureDefault =
    env.NODE_ENV !== "production" && env.ALLOW_INSECURE_SEED_DEFAULTS === "1";

  if (!canUseInsecureDefault) {
    throw new Error(
      `${envKey} must be set unless ALLOW_INSECURE_SEED_DEFAULTS=1 in non-production environments`,
    );
  }

  return fallback;
}

export async function upsertUser(
  prisma: SeedDbClient,
  params: {
    email: string;
    name: string;
    role: Role;
    password: string;
  },
  bcryptClient: BcryptLike = bcrypt,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: params.email },
    select: { passwordHash: true },
  });

  let passwordHash = existingUser?.passwordHash;

  if (!passwordHash) {
    passwordHash = await bcryptClient.hash(params.password, 10);
  } else {
    const passwordMatches = await bcryptClient.compare(params.password, passwordHash);

    if (!passwordMatches) {
      passwordHash = await bcryptClient.hash(params.password, 10);
    }
  }

  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      passwordHash,
    },
    create: {
      id: randomUUID(),
      email: params.email,
      name: params.name,
      role: params.role,
      isActive: true,
      passwordHash,
    },
  });
}

export async function seedDatabase(prisma: SeedDbClient, bcryptClient: BcryptLike = bcrypt) {
  const adminUser = await upsertUser(
    prisma,
    {
      email: "moshe.admin@apolles.dev",
      name: "Moshe",
      role: Role.ADMIN,
      password: getSeedPassword("SEED_ADMIN_PASSWORD", "AdminSeed123!"),
    },
    bcryptClient,
  );

  await upsertUser(
    prisma,
    {
      email: "agent.demo@apolles.dev",
      name: "Agent Demo",
      role: Role.AGENT,
      password: getSeedPassword("SEED_AGENT_PASSWORD", "AgentSeed123!"),
    },
    bcryptClient,
  );

  if (process.env.NODE_ENV !== "production") {
    await upsertUser(
      prisma,
      {
        email: "admin.test@apolles.local",
        name: "Admin Test",
        role: Role.ADMIN,
        password: "Admin123!",
      },
      bcryptClient,
    );

    await upsertUser(
      prisma,
      {
        email: "agent.test@apolles.local",
        name: "Agent Test",
        role: Role.AGENT,
        password: "Agent123!",
      },
      bcryptClient,
    );
  }

  try {
    await prisma.platformSetting.upsert({
      where: { key: "markup_percentage" },
      update: {
        value: "12",
        updatedBy: adminUser.id,
      },
      create: {
        key: "markup_percentage",
        value: "12",
        updatedBy: adminUser.id,
      },
    });
  } catch (error: unknown) {
    if (isMissingTableError(error, "platform_settings")) {
      return;
    }

    throw error;
  }
}

export async function runSeed(
  prisma: SeedDbClient = createSeedPrismaClient(),
  logger: SeedLogger = console,
) {
  try {
    await seedDatabase(prisma);
    logger.log("Seed completed: created/updated users and platform markup setting");
  } catch (error: unknown) {
    logger.error("Seed failed", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed().catch(() => {
    process.exit(1);
  });
}
