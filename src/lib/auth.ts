import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class InactiveAccountError extends CredentialsSignin {
  code = "inactive_account";
}

export const fullAuthConfig = {
  ...authConfig,
  secret: env.NEXTAUTH_SECRET,
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
            db.user.findUnique({
              where: { email },
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
      const userWithRole = user as typeof user & { role?: Role };
      const mutableToken = token as typeof token & { role?: Role };

      if (user) {
        if (!userWithRole.role) {
          logger.warn("JWT callback: role missing on user payload", {
            userId: user.id,
          });
        }

        mutableToken.sub = user.id;
        mutableToken.email = user.email;
        mutableToken.name = user.name;
        mutableToken.role = userWithRole.role ?? Role.AGENT;
      }

      return mutableToken;
    },
    session: async ({ session, token }) => {
      const tokenRole = (token as typeof token & { role?: Role }).role;

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? session.user.id,
          role: tokenRole === Role.ADMIN ? Role.ADMIN : Role.AGENT,
        },
      };
    },
  },
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers: authHandlers, auth, signIn, signOut } =
  NextAuth(fullAuthConfig);
