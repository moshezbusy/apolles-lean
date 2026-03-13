import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { PrismaClient, Role } from "@prisma/client";

type SeedPasswordKey = "SEED_ADMIN_PASSWORD" | "SEED_AGENT_PASSWORD";

type SeedLogger = Pick<typeof console, "log" | "error">;

type BcryptLike = Pick<typeof bcrypt, "compare" | "hash">;

type SeedDbClient = Pick<PrismaClient, "$disconnect" | "platformSetting" | "user">;

export function getSeedDatabaseUrl(baseUrl = process.env.DATABASE_URL) {
  if (!baseUrl) {
    return undefined;
  }

  if (baseUrl.includes("pgbouncer=true")) {
    return baseUrl;
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}pgbouncer=true&connection_limit=1`;
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

  if (env.NODE_ENV === "production") {
    throw new Error(`${envKey} must be set in production`);
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
      role: params.role,
      isActive: true,
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
