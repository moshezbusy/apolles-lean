import { describe, expect, it, vi } from "vitest";

import { Role } from "@prisma/client";

import {
  getSeedDatabaseUrl,
  getSeedPassword,
  isMissingTableError,
  runSeed,
  seedDatabase,
  upsertUser,
} from "../../prisma/seed";

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    platformSetting: {
      upsert: vi.fn(),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

describe("seed helpers", () => {
  it("adds pooler params for Supabase-style pooled URLs", () => {
    expect(getSeedDatabaseUrl("postgresql://db.example:6543/app")).toBe(
      "postgresql://db.example:6543/app?pgbouncer=true&connection_limit=1",
    );
    expect(
      getSeedDatabaseUrl("postgresql://db.example/app?sslmode=require&pgbouncer=true"),
    ).toBe(
      "postgresql://db.example/app?sslmode=require&pgbouncer=true&connection_limit=1",
    );
  });

  it("preserves direct URLs for non-pooled connections", () => {
    expect(getSeedDatabaseUrl("postgresql://db.example:5432/app?sslmode=require")).toBe(
      "postgresql://db.example:5432/app?sslmode=require",
    );
  });

  it("prefers DIRECT_URL over DATABASE_URL by default", () => {
    const previousDirect = process.env.DIRECT_URL;
    const previousDatabase = process.env.DATABASE_URL;

    process.env.DIRECT_URL = "postgresql://direct-host.example:5432/app?sslmode=require";
    process.env.DATABASE_URL = "postgresql://pooler.example:6543/app";

    expect(getSeedDatabaseUrl()).toBe("postgresql://direct-host.example:5432/app?sslmode=require");

    process.env.DIRECT_URL = previousDirect;
    process.env.DATABASE_URL = previousDatabase;
  });

  it("uses fallback seed password only when explicitly allowed", () => {
    expect(
      getSeedPassword("SEED_ADMIN_PASSWORD", "AdminSeed123!", {
        NODE_ENV: "test",
        ALLOW_INSECURE_SEED_DEFAULTS: "1",
      }),
    ).toBe("AdminSeed123!");
  });

  it("requires explicit seed passwords when insecure defaults are not enabled", () => {
    expect(() =>
      getSeedPassword("SEED_AGENT_PASSWORD", "AgentSeed123!", { NODE_ENV: "test" }),
    ).toThrow(
      "SEED_AGENT_PASSWORD must be set unless ALLOW_INSECURE_SEED_DEFAULTS=1 in non-production environments",
    );
  });

  it("detects Prisma missing table errors", () => {
    expect(
      isMissingTableError(
        {
          code: "P2021",
          message: "The table `public.platform_settings` does not exist in the current database.",
        },
        "platform_settings",
      ),
    ).toBe(true);

    expect(
      isMissingTableError(
        {
          code: "P2021",
          meta: { table: "public.platform_settings" },
        },
        "platform_settings",
      ),
    ).toBe(true);

    expect(
      isMissingTableError(
        {
          code: "P2021",
          message: "The table `public.users` does not exist in the current database.",
        },
        "platform_settings",
      ),
    ).toBe(false);
  });
});

describe("upsertUser", () => {
  it("reuses an existing hash when the password already matches", async () => {
    const prisma = createMockPrisma();
    const bcryptClient = {
      compare: vi.fn().mockResolvedValue(true),
      hash: vi.fn(),
    };

    prisma.user.findUnique.mockResolvedValue({ passwordHash: "stored-hash" });
    prisma.user.upsert.mockResolvedValue({ id: "agent-id" });

    await upsertUser(
      prisma as never,
      {
        email: "agent.demo@apolles.dev",
        name: "Agent Demo",
        role: Role.AGENT,
        password: "AgentSeed123!",
      },
      bcryptClient,
    );

    expect(bcryptClient.hash).not.toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ name: "Agent Demo", passwordHash: "stored-hash" }),
      }),
    );
    const firstUpsertCall = prisma.user.upsert.mock.calls.at(0);
    expect(firstUpsertCall).toBeDefined();
    const updatePayload = firstUpsertCall?.[0].update;
    expect(updatePayload).not.toHaveProperty("role");
    expect(updatePayload).not.toHaveProperty("isActive");
  });
});

describe("seedDatabase", () => {
  it("creates the admin, agent, and markup setting", async () => {
    const prisma = createMockPrisma();
    const bcryptClient = {
      compare: vi.fn().mockResolvedValue(false),
      hash: vi.fn().mockResolvedValue("new-hash"),
    };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert
      .mockResolvedValueOnce({ id: "admin-id" })
      .mockResolvedValueOnce({ id: "agent-id" })
      .mockResolvedValueOnce({ id: "local-admin-id" })
      .mockResolvedValueOnce({ id: "local-agent-id" });
    prisma.platformSetting.upsert.mockResolvedValue({ key: "markup_percentage" });

    await seedDatabase(prisma as never, bcryptClient);

    expect(prisma.user.upsert).toHaveBeenCalledTimes(4);
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "admin.test@apolles.local" } }),
    );
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "agent.test@apolles.local" } }),
    );
    expect(prisma.platformSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "markup_percentage" },
        create: expect.objectContaining({ updatedBy: "admin-id", value: "12" }),
      }),
    );
  });

  it("still seeds users when platform_settings table is missing", async () => {
    const prisma = createMockPrisma();
    const bcryptClient = {
      compare: vi.fn().mockResolvedValue(false),
      hash: vi.fn().mockResolvedValue("new-hash"),
    };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert
      .mockResolvedValueOnce({ id: "admin-id" })
      .mockResolvedValueOnce({ id: "agent-id" })
      .mockResolvedValueOnce({ id: "local-admin-id" })
      .mockResolvedValueOnce({ id: "local-agent-id" });
    prisma.platformSetting.upsert.mockRejectedValue({
      code: "P2021",
      message: "The table `public.platform_settings` does not exist in the current database.",
    });

    await expect(seedDatabase(prisma as never, bcryptClient)).resolves.toBeUndefined();
    expect(prisma.user.upsert).toHaveBeenCalledTimes(4);
  });
});

describe("runSeed", () => {
  it("disconnects and logs success", async () => {
    const prisma = createMockPrisma();
    const logger = {
      log: vi.fn(),
      error: vi.fn(),
    };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert
      .mockResolvedValueOnce({ id: "admin-id" })
      .mockResolvedValueOnce({ id: "agent-id" })
      .mockResolvedValueOnce({ id: "local-admin-id" })
      .mockResolvedValueOnce({ id: "local-agent-id" });
    prisma.platformSetting.upsert.mockResolvedValue({ key: "markup_percentage" });

    await runSeed(prisma as never, logger);

    expect(logger.log).toHaveBeenCalledWith(
      "Seed completed: created/updated users and platform markup setting",
    );
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
  });
});
