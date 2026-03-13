import { describe, expect, it } from "vitest";

import { db } from "~/lib/db";

describe("db singleton", () => {
  it("exports a prisma client instance", () => {
    expect(db).toBeDefined();
    expect(typeof db.$disconnect).toBe("function");
  });

  it("caches the instance on globalThis in non-production", () => {
    const g = globalThis as unknown as { prisma?: unknown };
    expect(g.prisma).toBe(db);
  });

  it("globalThis.prisma and module export are the same object", () => {
    // Verifies the singleton wiring: the module-level export and the
    // globalThis cache must reference the exact same PrismaClient instance.
    const g = globalThis as unknown as { prisma?: unknown };
    expect(g.prisma).toBeDefined();
    expect(db).toBe(g.prisma);
    // Structural check: ensure it's actually a PrismaClient, not just any object
    expect(typeof db.$connect).toBe("function");
    expect(typeof db.$executeRaw).toBe("function");
  });
});
