import "dotenv/config";

import { defineConfig } from "prisma/config";

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(directUrl || databaseUrl
    ? {
        datasource: {
          url: directUrl || databaseUrl,
        },
      }
    : {}),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
