import { describe, expect, it, vi } from "vitest";

import { Role } from "@prisma/client";

import {
  getSeedDatabaseUrl,
  getSeedPassword,
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
  it("adds pooler params only once", () => {
    expect(getSeedDatabaseUrl("postgresql://db.example/app")).toBe(
      "postgresql://db.example/app?pgbouncer=true&connection_limit=1",
    );
    expect(
      getSeedDatabaseUrl("postgresql://db.example/app?sslmode=require&pgbouncer=true"),
    ).toBe("postgresql://db.example/app?sslmode=require&pgbouncer=true");
  });

  it("uses fallback seed password outside production", () => {
    expect(
      getSeedPassword("SEED_ADMIN_PASSWORD", "AdminSeed123!", { NODE_ENV: "test" }),
    ).toBe("AdminSeed123!");
  });

  it("requires explicit seed passwords in production", () => {
    expect(() =>
      getSeedPassword("SEED_AGENT_PASSWORD", "AgentSeed123!", { NODE_ENV: "production" }),
    ).toThrow("SEED_AGENT_PASSWORD must be set in production");
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
        update: expect.objectContaining({ passwordHash: "stored-hash" }),
      }),
    );
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
      .mockResolvedValueOnce({ id: "agent-id" });
    prisma.platformSetting.upsert.mockResolvedValue({ key: "markup_percentage" });

    await seedDatabase(prisma as never, bcryptClient);

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.platformSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "markup_percentage" },
        create: expect.objectContaining({ updatedBy: "admin-id", value: "12" }),
      }),
    );
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
      .mockResolvedValueOnce({ id: "agent-id" });
    prisma.platformSetting.upsert.mockResolvedValue({ key: "markup_percentage" });

    await runSeed(prisma as never, logger);

    expect(logger.log).toHaveBeenCalledWith(
      "Seed completed: created/updated users and platform markup setting",
    );
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
  });
});
