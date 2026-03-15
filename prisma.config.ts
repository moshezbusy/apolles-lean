import { defineConfig } from "prisma/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseEnvValue(rawValue: string) {
  const trimmed = rawValue.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFile(filePath: string, override: boolean) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/u);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1);
    if (!key) {
      continue;
    }

    if (!override && process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseEnvValue(rawValue);
  }
}

const projectRoot = process.cwd();
loadEnvFile(path.resolve(projectRoot, ".env"), false);
loadEnvFile(path.resolve(projectRoot, ".env.local"), true);

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (directUrl) {
  process.env.DATABASE_URL = directUrl;
}

const prismaDatasourceUrl = process.env.DATABASE_URL?.trim() ?? databaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(prismaDatasourceUrl
    ? {
        datasource: {
          url: prismaDatasourceUrl,
        },
      }
    : {}),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
