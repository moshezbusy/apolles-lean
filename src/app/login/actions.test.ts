import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, deleteManyMock, signInMock, signOutMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  deleteManyMock: vi.fn(),
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type: string;

    constructor(type: string) {
      super(type);
      this.name = "AuthError";
      this.type = type;
    }
  },
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("~/lib/auth", () => ({
  signIn: signInMock,
  signOut: signOutMock,
}));

vi.mock("~/lib/db", () => ({
  db: {
    session: {
      deleteMany: deleteManyMock,
    },
  },
}));

import { loginAction, logoutAction } from "~/app/login/actions";
import { signIn, signOut } from "~/lib/auth";
import { AuthError } from "next-auth";

function createFormData(overrides?: {
  email?: string;
  password?: string;
  callbackUrl?: string;
}) {
  const formData = new FormData();
  formData.set("email", overrides?.email ?? "agent@example.com");
  formData.set("password", overrides?.password ?? "Password123!");

  if (overrides?.callbackUrl) {
    formData.set("callbackUrl", overrides.callbackUrl);
  }

  return formData;
}

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });
  });

  it("passes through a safe callbackUrl on successful login", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined);

    const result = await loginAction(
      { error: null },
      createFormData({ callbackUrl: "/reservations?page=2" }),
    );

    expect(result).toEqual({ error: null });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "agent@example.com",
      password: "Password123!",
      redirectTo: "/reservations?page=2",
    });
  });

  it("falls back to search when callbackUrl is unsafe", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined);

    await loginAction(
      { error: null },
      createFormData({ callbackUrl: "https://evil.example.com" }),
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "agent@example.com",
      password: "Password123!",
      redirectTo: "/search",
    });
  });

  it("returns the inactive-account message for inactive users", async () => {
    const error = new AuthError("CredentialsSignin");
    Object.assign(error, { code: "inactive_account" });
    vi.mocked(signIn).mockRejectedValue(error);

    const result = await loginAction({ error: null }, createFormData());

    expect(result).toEqual({ error: "Account is inactive" });
  });

  it("returns the generic invalid-credentials message for auth failures", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("CredentialsSignin"));

    const result = await loginAction({ error: null }, createFormData());

    expect(result).toEqual({ error: "Invalid email or password" });
  });

  it("delegates logout to NextAuth signOut with login redirect", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });
    cookiesMock.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "authjs.session-token" ? { name, value: "session-token" } : undefined,
      ),
    });
    vi.mocked(signOut).mockResolvedValue(undefined);

    await logoutAction();

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        sessionToken: {
          in: ["session-token"],
        },
      },
    });
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("deletes a secure production session token before redirecting to login", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });
    cookiesMock.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "__Secure-authjs.session-token"
          ? { name, value: "secure-session-token" }
          : undefined,
      ),
    });
    vi.mocked(signOut).mockResolvedValue(undefined);

    await logoutAction();

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        sessionToken: {
          in: ["secure-session-token"],
        },
      },
    });
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("still redirects to login when no database session cookie is present", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);

    await logoutAction();

    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
