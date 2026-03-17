import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loggerWarnMock, nextAuthMock } = vi.hoisted(() => ({
  loggerWarnMock: vi.fn(),
  nextAuthMock: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth", () => ({
  default: nextAuthMock,
  CredentialsSignin: class CredentialsSignin extends Error {
    code = "credentials";
  },
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: unknown) => config),
}));

vi.mock("~/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("~/env", () => ({
  env: {
    NEXTAUTH_SECRET: "test-secret",
  },
}));

vi.mock("~/lib/logger", () => ({
  logger: {
    warn: loggerWarnMock,
  },
}));

import { auth, fullAuthConfig, getValidatedSession } from "~/lib/auth";

describe("fullAuthConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses JWT sessions so credentials sign-in is supported", () => {
    expect(fullAuthConfig.session).toMatchObject({
      strategy: "jwt",
      maxAge: 60 * 30,
      updateAge: 5 * 60,
    });
  });

  it("stores the authenticated user identity on the JWT payload", async () => {
    const token = await fullAuthConfig.callbacks?.jwt?.({
      token: {},
      user: {
        id: "user-1",
        role: Role.ADMIN,
      } as never,
    } as never);

    expect(token).toMatchObject({
      sub: "user-1",
      role: Role.ADMIN,
    });
  });

  it("enforces secure session cookie flags from config", () => {
    expect(fullAuthConfig.cookies?.sessionToken?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

  it("fails closed when the session callback receives a token without a role", async () => {
    await expect(
      fullAuthConfig.callbacks?.session?.({
        session: {
          user: {
            email: "agent@example.com",
          },
          expires: "2026-03-14T00:00:00.000Z",
        },
        token: {
          sub: "user-1",
        } as never,
      } as never),
    ).rejects.toThrow("Session callback: role missing on user payload");

    expect(loggerWarnMock).toHaveBeenCalledWith(
      "Session callback: role missing on user payload",
        { userId: "user-1" },
      );
  });

  it("keeps the JWT role on the session payload", async () => {
    const session = await fullAuthConfig.callbacks?.session?.({
      session: {
        user: {
          email: "agent@example.com",
          name: "Agent Example",
        },
        expires: "2026-03-14T00:00:00.000Z",
      },
      token: {
        sub: "user-1",
        role: Role.ADMIN,
      } as never,
    } as never);

    expect(session?.user).toMatchObject({
      id: "user-1",
      role: Role.ADMIN,
    });
  });

  it("treats malformed session payloads as unauthenticated instead of crashing callers", async () => {
    vi.mocked(auth).mockRejectedValue(
      new Error("Session callback: role missing on user payload"),
    );

    await expect(getValidatedSession()).resolves.toBeNull();
  });

  it("returns the validated session when the payload is well-formed", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        name: "Agent Example",
        role: Role.AGENT,
      },
    } as never);

    await expect(getValidatedSession()).resolves.toMatchObject({
      user: {
        id: "user-1",
        name: "Agent Example",
        role: Role.AGENT,
      },
    });
  });
});
