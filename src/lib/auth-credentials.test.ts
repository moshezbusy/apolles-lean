import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

import {
  type AuthUserRecord,
  verifyCredentials,
} from "~/lib/auth-credentials";

async function makeUser(overrides: Partial<AuthUserRecord> = {}): Promise<AuthUserRecord> {
  return {
    id: crypto.randomUUID(),
    email: "agent@example.com",
    name: "Agent",
    passwordHash: await bcrypt.hash("Password123!", 10),
    isActive: true,
    role: "AGENT",
    ...overrides,
  };
}

describe("verifyCredentials", () => {
  it("returns authenticated when email and password are valid", async () => {
    const user = await makeUser();

    const result = await verifyCredentials({
      email: user.email,
      password: "Password123!",
      findUserByEmail: async () => user,
    });

    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
    }
  });

  it("returns inactive when account exists but is deactivated", async () => {
    const user = await makeUser({ isActive: false });

    const result = await verifyCredentials({
      email: user.email,
      password: "Password123!",
      findUserByEmail: async () => user,
    });

    expect(result.status).toBe("inactive");
  });

  it("returns invalid when account is missing", async () => {
    const result = await verifyCredentials({
      email: "missing@example.com",
      password: "Password123!",
      findUserByEmail: async () => null,
    });

    expect(result.status).toBe("invalid");
  });

  it("returns invalid when password does not match", async () => {
    const user = await makeUser();

    const result = await verifyCredentials({
      email: user.email,
      password: "WrongPassword123!",
      findUserByEmail: async () => user,
    });

    expect(result.status).toBe("invalid");
  });
});
