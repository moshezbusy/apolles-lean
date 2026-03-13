"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "~/lib/auth";
import { runProtectedAction, type ActionResult } from "~/lib/authorize";
import { db } from "~/lib/db";
import { AppError, ErrorCodes } from "~/lib/errors";
import {
  createAgentInputSchema,
  setAgentStatusInputSchema,
  type CreateAgentInput,
  type SetAgentStatusInput,
} from "~/features/admin/agents/schemas";

export type AgentListItem = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
};

type CreateAgentResult = {
  agentId: string;
  message: string;
};

type SetAgentStatusResult = {
  userId: string;
  isActive: boolean;
  message: string;
};

function parseCreateAgentInput(formData: FormData): CreateAgentInput {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

function parseSetAgentStatusInput(formData: FormData): SetAgentStatusInput {
  return {
    userId: String(formData.get("userId") ?? ""),
    isActive: String(formData.get("isActive") ?? "") === "true",
  };
}

export async function listAgentsAction(): Promise<ActionResult<AgentListItem[]>> {
  const session = await auth();

  return runProtectedAction({
    session,
    input: undefined,
    role: "admin",
    execute: async () => {
      const agents = await db.user.findMany({
        where: {
          role: Role.AGENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return agents;
    },
  });
}

export async function createAgentAction(formData: FormData): Promise<ActionResult<CreateAgentResult>> {
  const session = await auth();

  return runProtectedAction({
    session,
    input: parseCreateAgentInput(formData),
    role: "admin",
    validate: (input) => createAgentInputSchema.parse(input),
    execute: async ({ input }) => {
      const existingUser = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (existingUser) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "An agent with this email already exists", 409);
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: Role.AGENT,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      revalidatePath("/admin/settings");

      return {
        agentId: user.id,
        message: "Agent created",
      };
    },
  });
}

export async function setAgentStatusAction(
  formData: FormData,
): Promise<ActionResult<SetAgentStatusResult>> {
  const session = await auth();

  return runProtectedAction({
    session,
    input: parseSetAgentStatusInput(formData),
    role: "admin",
    validate: (input) => setAgentStatusInputSchema.parse(input),
    execute: async ({ session: currentSession, input }) => {
      if (currentSession.user.id === input.userId) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "You cannot change your own account status", 400);
      }

      const existingUser = await db.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!existingUser) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Agent account not found", 404);
      }

      if (existingUser.role !== Role.AGENT) {
        throw new AppError(ErrorCodes.NOT_AUTHORIZED, "Only agent accounts can be changed", 403);
      }

      await db.user.update({
        where: { id: input.userId },
        data: { isActive: input.isActive },
      });

      revalidatePath("/admin/settings");

      return {
        userId: input.userId,
        isActive: input.isActive,
        message: input.isActive ? "Agent activated" : "Agent deactivated",
      };
    },
  });
}
