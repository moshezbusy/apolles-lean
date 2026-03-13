import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Prisma auth schema compatibility", () => {
  it("keeps Role enum mappings aligned with migration labels", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const migration = readProjectFile(
      "prisma/migrations/20260312000000_init_auth_ready_data_model/migration.sql",
    );

    expect(schema).toContain("AGENT @map(\"agent\")");
    expect(schema).toContain("ADMIN @map(\"platform_admin\")");
    expect(schema).toContain("@@map(\"UserRole\")");

    expect(migration).toContain("CREATE TYPE \"UserRole\" AS ENUM ('agent', 'platform_admin');");
    expect(migration).toContain('"role" "UserRole" NOT NULL DEFAULT \'agent\'');
  });
});
