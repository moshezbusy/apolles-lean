import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    TBO_API_KEY: z.string().min(1),
    TBO_API_SECRET: z.string().min(1),
    EXPEDIA_API_KEY: z.string().min(1),
    EXPEDIA_API_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    TBO_API_KEY: process.env.TBO_API_KEY,
    TBO_API_SECRET: process.env.TBO_API_SECRET,
    EXPEDIA_API_KEY: process.env.EXPEDIA_API_KEY,
    EXPEDIA_API_SECRET: process.env.EXPEDIA_API_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
