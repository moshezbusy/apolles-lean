import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  buildBookingScope,
  requireAuth,
  requireRole,
  runProtectedAction,
  type SessionLike,
} from "~/lib/authorize";
import { AppError, ErrorCodes } from "~/lib/errors";

function createSession(role: "ADMIN" | "AGENT", userId = "user-1"): SessionLike {
  return {
    user: {
      id: userId,
      role,
    },
  };
}

describe("requireAuth", () => {
  it("accepts a valid authenticated agent session", () => {
    const session = createSession("AGENT");

    expect(() => requireAuth(session)).not.toThrow();
  });

  it("throws NOT_AUTHENTICATED when no session exists", () => {
    expect(() => requireAuth(null)).toThrowError(AppError);

    try {
      requireAuth(null);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCodes.NOT_AUTHENTICATED);
    }
  });

  it("throws NOT_AUTHENTICATED when session has no user id", () => {
    const session: SessionLike = {
      user: {
        role: "AGENT",
      },
    };

    expect(() => requireAuth(session)).toThrowError(AppError);
  });
});

describe("requireRole", () => {
  it("allows admin when admin role is required", () => {
    const session = createSession("ADMIN");

    expect(() => requireRole(session, "admin")).not.toThrow();
  });

  it("throws NOT_AUTHORIZED for wrong role", () => {
    const session = createSession("AGENT");

    expect(() => requireRole(session, "admin")).toThrowError(AppError);

    try {
      requireRole(session, "admin");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCodes.NOT_AUTHORIZED);
    }
  });

  it("allows admin when agent role is required", () => {
    const session = createSession("ADMIN");

    expect(() => requireRole(session, "agent")).not.toThrow();
  });
});

describe("buildBookingScope", () => {
  it("returns scoped filter for agents", () => {
    const session = createSession("AGENT", "agent-42");

    expect(buildBookingScope(session)).toEqual({ where: { agentId: "agent-42" } });
  });

  it("returns unscoped filter for admins", () => {
    const session = createSession("ADMIN", "admin-1");

    expect(buildBookingScope(session)).toEqual({});
  });
});

describe("runProtectedAction", () => {
  it("returns typed authorization failure for wrong role", async () => {
    const result = await runProtectedAction({
      session: createSession("AGENT"),
      role: "admin",
      input: { id: "1" },
      execute: async () => "ok",
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.NOT_AUTHORIZED,
        message: "You are not authorized to perform this action",
      },
    });
  });

  it("enforces precondition order by skipping validation when unauthenticated", async () => {
    const validate = vi.fn((input: { value: string }) => input);

    const result = await runProtectedAction({
      session: null,
      role: "admin",
      input: { value: "x" },
      validate,
      execute: async () => "ok",
    });

    expect(validate).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.NOT_AUTHENTICATED,
        message: "Authentication required",
      },
    });
  });

  it("returns success with validated input when authorized", async () => {
    const validate = vi.fn((input: { value: string }) => ({
      value: input.value.toUpperCase(),
    }));

    const execute = vi.fn(async ({ input }: { input: { value: string } }) => input.value);

    const result = await runProtectedAction({
      session: createSession("ADMIN"),
      role: "admin",
      input: { value: "ok" },
      validate,
      execute,
    });

    expect(validate).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true, data: "OK" });
  });

  it("skips validation when role check fails", async () => {
    const validate = vi.fn((input: { value: string }) => input);
    const execute = vi.fn(async () => "ok");

    const result = await runProtectedAction({
      session: createSession("AGENT"),
      role: "admin",
      input: { value: "x" },
      validate,
      execute,
    });

    expect(validate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.NOT_AUTHORIZED,
        message: "You are not authorized to perform this action",
      },
    });
  });

  it("returns VALIDATION_ERROR when validation fails", async () => {
    const schema = z.object({ value: z.string().min(2, "value too short") });

    const result = await runProtectedAction({
      session: createSession("ADMIN"),
      role: "admin",
      input: { value: "x" },
      validate: (input) => schema.parse(input),
      execute: async () => "ok",
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: "value too short",
      },
    });
  });

  it("returns INTERNAL_ERROR for unexpected failures", async () => {
    const result = await runProtectedAction({
      session: createSession("ADMIN"),
      role: "admin",
      input: { value: "ok" },
      execute: async () => {
        throw new Error("boom");
      },
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "An unexpected error occurred",
      },
    });
  });
});
