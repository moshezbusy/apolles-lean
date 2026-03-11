import { describe, expect, it } from "vitest";

import { db } from "~/lib/db";

describe("db singleton", () => {
  it("exports a prisma client instance", () => {
    expect(db).toBeDefined();
    expect(typeof db.$disconnect).toBe("function");
  });

  it("returns the same instance on repeated imports (singleton)", async () => {
    // Dynamic re-import to verify the module-level singleton
    const { db: db2 } = await import("~/lib/db");
    expect(db).toBe(db2);
  });

  it("caches the instance on globalThis in non-production", () => {
    const g = globalThis as unknown as { prisma?: unknown };
    expect(g.prisma).toBe(db);
  });
});
