import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAgentAction,
  listAgentsAction,
  setAgentStatusAction,
} from "~/features/admin/agents/actions";
import { getValidatedSession } from "~/lib/auth";
import { db } from "~/lib/db";
import { ErrorCodes } from "~/lib/errors";

vi.mock("~/lib/auth", () => ({
  getValidatedSession: vi.fn(),
}));

vi.mock("~/lib/db", () => ({
    db: {
      $transaction: vi.fn(),
      session: {
        deleteMany: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function createAdminSession() {
  return {
    user: {
      id: crypto.randomUUID(),
      role: Role.ADMIN,
    },
  };
}

function createAgentSession() {
  return {
    user: {
      id: crypto.randomUUID(),
      role: Role.AGENT,
    },
  };
}

describe("admin agent actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(db as never);
      }

      return callback as never;
    });
  });

  it("returns NOT_AUTHORIZED when non-admin attempts create", async () => {
    vi.mocked(getValidatedSession).mockResolvedValue(createAgentSession() as never);

    const formData = new FormData();
    formData.set("name", "Agent One");
    formData.set("email", "agent1@example.com");
    formData.set("password", "Password123!!");

    const result = await createAgentAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCodes.NOT_AUTHORIZED);
    }
  });

  it("returns NOT_AUTHORIZED when non-admin attempts list", async () => {
    vi.mocked(getValidatedSession).mockResolvedValue(createAgentSession() as never);

    const result = await listAgentsAction();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCodes.NOT_AUTHORIZED);
    }
  });

  it("lists only agents for admin users", async () => {
    vi.mocked(getValidatedSession).mockResolvedValue(createAdminSession() as never);
    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: crypto.randomUUID(),
        name: "Agent One",
        email: "agent1@example.com",
        isActive: true,
        createdAt: new Date("2026-03-10T10:00:00Z"),
      },
    ] as never);

    const result = await listAgentsAction();

    expect(result).toEqual({
      success: true,
      data: [
        {
          id: expect.any(String),
          name: "Agent One",
          email: "agent1@example.com",
          isActive: true,
          createdAt: new Date("2026-03-10T10:00:00Z"),
        },
      ],
    });
    expect(db.user.findMany).toHaveBeenCalledWith({
      where: { role: Role.AGENT },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns clear duplicate-email error", async () => {
    vi.mocked(getValidatedSession).mockResolvedValue(createAdminSession() as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: crypto.randomUUID() } as never);

    const formData = new FormData();
    formData.set("name", "Agent One");
    formData.set("email", "agent1@example.com");
    formData.set("password", "Password123!!");

    const result = await createAgentAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(result.error.message).toContain("already exists");
    }
  });

  it("creates an active AGENT user with bcrypt hash", async () => {
    vi.mocked(getValidatedSession).mockResolvedValue(createAdminSession() as never);
    vi.mocked(db.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(db.user.create).mockResolvedValue({ id: crypto.randomUUID() } as never);

    const formData = new FormData();
    formData.set("name", "Agent Two");
    formData.set("email", "agent2@example.com");
    formData.set("password", "Password123!!");

    const result = await createAgentAction(formData);

    expect(result.success).toBe(true);
    expect(db.user.create).toHaveBeenCalledOnce();

    const call = vi.mocked(db.user.create).mock.calls[0]?.[0];
    expect(call?.data.role).toBe(Role.AGENT);
    expect(call?.data.isActive).toBe(true);
    expect(typeof call?.data.passwordHash).toBe("string");
    expect(call?.data.passwordHash).not.toBe("Password123!!");
    expect(await bcrypt.compare("Password123!!", call?.data.passwordHash ?? "")).toBe(true);
  });

  it("returns a typed duplicate-email error when create hits a unique constraint race", async () => {
    vi.mocked(getValidatedSession).mockResolvedValue(createAdminSession() as never);
    vi.mocked(db.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(db.user.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.6.0",
      }),
    );

    const formData = new FormData();
    formData.set("name", "Agent One");
    formData.set("email", "agent1@example.com");
    formData.set("password", "Password123!!");

    const result = await createAgentAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(result.error.message).toContain("already exists");
    }
  });

  it("toggles agent status with typed success response", async () => {
    const admin = createAdminSession();
    const agentId = crypto.randomUUID();

    vi.mocked(getValidatedSession).mockResolvedValue(admin as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: agentId, role: Role.AGENT } as never);
    vi.mocked(db.user.update).mockResolvedValue({ id: agentId } as never);

    const formData = new FormData();
    formData.set("userId", agentId);
    formData.set("isActive", "false");

    const result = await setAgentStatusAction(formData);

    expect(result).toEqual({
      success: true,
      data: {
        userId: agentId,
        isActive: false,
        message: "Agent deactivated",
      },
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: agentId },
      data: { isActive: false },
    });
    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: agentId },
    });
  });

  it("does not revoke sessions when re-activating an agent", async () => {
    const admin = createAdminSession();
    const agentId = crypto.randomUUID();

    vi.mocked(getValidatedSession).mockResolvedValue(admin as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: agentId, role: Role.AGENT } as never);
    vi.mocked(db.user.update).mockResolvedValue({ id: agentId } as never);

    const formData = new FormData();
    formData.set("userId", agentId);
    formData.set("isActive", "true");

    const result = await setAgentStatusAction(formData);

    expect(result).toEqual({
      success: true,
      data: {
        userId: agentId,
        isActive: true,
        message: "Agent activated",
      },
    });
    expect(db.session.deleteMany).not.toHaveBeenCalled();
  });

  it("prevents admin from changing their own active status", async () => {
    const admin = createAdminSession();
    vi.mocked(getValidatedSession).mockResolvedValue(admin as never);

    const formData = new FormData();
    formData.set("userId", admin.user.id);
    formData.set("isActive", "false");

    const result = await setAgentStatusAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(result.error.message).toContain("cannot change your own");
    }
  });
});
