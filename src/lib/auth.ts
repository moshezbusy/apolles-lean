import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma, Role } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import { AuthError } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { z } from "zod";

import { authConfig } from "~/lib/auth.config";
import { db } from "~/lib/db";
import { env } from "~/env";
import { logger } from "~/lib/logger";
import { verifyCredentials } from "~/lib/auth-credentials";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class InactiveAccountError extends CredentialsSignin {
  code = "inactive_account";
}

const SESSION_ROLE_MISSING_MESSAGE = "Session callback: role missing on user payload";
const RECOVERABLE_AUTH_ERROR_TYPES = new Set(["JWTSessionError", "SessionTokenError"]);
const LAST_LOGIN_COLUMN_NAME = "last_login_at";

function shouldTrustAuthHost() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  try {
    const authUrl = new URL(env.NEXTAUTH_URL);
    return authUrl.hostname === "localhost" || authUrl.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMissingLastLoginColumnError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2022") {
    return false;
  }

  const meta = isRecord(error.meta) ? error.meta : undefined;
  const column = typeof meta?.column === "string" ? meta.column.toLowerCase() : undefined;

  return (
    column === LAST_LOGIN_COLUMN_NAME ||
    error.message.toLowerCase().includes(LAST_LOGIN_COLUMN_NAME)
  );
}

async function updateLastLoginAt(userId: string) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    if (isMissingLastLoginColumnError(error)) {
      logger.warn("Skipping last-login audit because the database schema is outdated", {
        userId,
        column: LAST_LOGIN_COLUMN_NAME,
      });
      return;
    }

    throw error;
  }
}

function getTokenUserId(token: JWT) {
  return typeof token.sub === "string" && token.sub.length > 0 ? token.sub : null;
}

export const fullAuthConfig = {
  ...authConfig,
  secret: env.NEXTAUTH_SECRET,
  trustHost: shouldTrustAuthHost(),
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 60 * 30,
    updateAge: 5 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const result = await verifyCredentials({
          email: parsed.data.email,
          password: parsed.data.password,
          findUserByEmail: async (email) =>
            db.user.findFirst({
              where: {
                email: {
                  equals: email,
                  mode: "insensitive",
                },
              },
              select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
                isActive: true,
                role: true,
              },
            }),
        });

        if (result.status !== "authenticated") {
          if (result.status === "inactive") {
            throw new InactiveAccountError();
          }
          return null;
        }

        await updateLastLoginAt(result.user.id);

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const userWithRole = user as typeof user & { role?: Role };

        return {
          ...token,
          sub: user.id,
          role: userWithRole.role,
        };
      }

      return token;
    },
    session: async ({ session, token }) => {
      const userId = getTokenUserId(token);

      if (!userId || !token.role) {
        logger.warn(SESSION_ROLE_MISSING_MESSAGE, {
          userId,
        });

        throw new Error(SESSION_ROLE_MISSING_MESSAGE);
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: userId,
          role: token.role,
        },
      };
    },
  },
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers: authHandlers, auth, signIn, signOut } =
  NextAuth(fullAuthConfig);

export async function getValidatedSession() {
  try {
    return await auth();
  } catch (error) {
    if (
      (error instanceof Error && error.message === SESSION_ROLE_MISSING_MESSAGE) ||
      (error instanceof AuthError && RECOVERABLE_AUTH_ERROR_TYPES.has(error.type))
    ) {
      return null;
    }

    throw error;
  }
}
