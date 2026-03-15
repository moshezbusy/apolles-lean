import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Prisma auth schema compatibility", () => {
  it("keeps Role enum mappings aligned with migration labels", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const prismaConfig = readProjectFile("prisma.config.ts");
    const initMigration = readProjectFile(
      "prisma/migrations/20260312000000_init_auth_ready_data_model/migration.sql",
    );
    const supplierLogsMigration = readProjectFile(
      "prisma/migrations/20260312150000_add_supplier_api_logs/migration.sql",
    );
    const platformSettingsMigration = readProjectFile(
      "prisma/migrations/20260313014500_add_platform_settings/migration.sql",
    );

    expect(schema).toContain("AGENT @map(\"agent\")");
    expect(schema).toContain("ADMIN @map(\"platform_admin\")");
    expect(schema).toContain("@@map(\"UserRole\")");
    expect(schema).toContain("emailVerified  DateTime?       @map(\"email_verified\")");
    expect(schema).toContain("model Authenticator {");
    expect(schema).toContain("model PlatformSetting {");
    expect(schema).toContain("model SupplierApiLog {");
    expect(prismaConfig).toContain('process.env.DIRECT_URL?.trim()');
    expect(prismaConfig).toContain('process.env.DATABASE_URL?.trim()');
    expect(prismaConfig).toContain('process.env.DATABASE_URL = directUrl');
    expect(prismaConfig).toContain('url: prismaDatasourceUrl');

    expect(initMigration).toContain("CREATE TYPE \"UserRole\" AS ENUM ('agent', 'platform_admin');");
    expect(initMigration).toContain('"role" "UserRole" NOT NULL DEFAULT \'agent\'');
    expect(initMigration).toContain('"email_verified" TIMESTAMP(3)');
    expect(initMigration).toContain('CREATE TABLE "authenticators"');
    expect(supplierLogsMigration).toContain('CREATE TABLE "supplier_api_logs"');
    expect(platformSettingsMigration).toContain('CREATE TABLE "platform_settings"');
  });
});
