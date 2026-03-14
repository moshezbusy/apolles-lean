import { type Role } from "@prisma/client";
import { ZodError } from "zod";

import { AppError, ErrorCodes, type ErrorCode } from "~/lib/errors";

export type AuthorizationRole = "admin" | "agent";

export type SessionLike = {
  user?: {
    id?: string;
    role?: Role;
  };
} | null;

export type AuthenticatedSession = {
  user: {
    id: string;
    role: Role;
  };
};

export type ActionError = {
  code: ErrorCode;
  message: string;
};

export type ActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: ActionError };

export type BookingScope =
  | { where: { agentId: string } }
  | { where?: undefined };

type ProtectedActionParams<TInput, TData> = {
  session: SessionLike;
  input: TInput;
  role?: AuthorizationRole;
  validate?: (input: TInput) => TInput;
  execute: (args: { session: AuthenticatedSession; input: TInput }) => Promise<TData> | TData;
};

function toPrismaRole(role: AuthorizationRole): Role {
  return role === "admin" ? "ADMIN" : "AGENT";
}

function assertAuthenticatedSession(session: SessionLike): asserts session is AuthenticatedSession {
  if (!session?.user?.id || !session.user.role) {
    throw new AppError(ErrorCodes.NOT_AUTHENTICATED, "Authentication required");
  }
}

export function requireAuth(session: SessionLike): asserts session is AuthenticatedSession {
  assertAuthenticatedSession(session);
}

export function requireRole(session: SessionLike, role: AuthorizationRole): void {
  assertAuthenticatedSession(session);

  if (session.user.role !== "ADMIN" && session.user.role !== toPrismaRole(role)) {
    throw new AppError(ErrorCodes.NOT_AUTHORIZED, "You are not authorized to perform this action");
  }
}

export function buildBookingScope(session: SessionLike): BookingScope {
  assertAuthenticatedSession(session);

  if (session.user.role === "ADMIN") {
    return {};
  }

  return { where: { agentId: session.user.id } };
}

export async function runProtectedAction<TInput, TData>({
  session,
  input,
  role,
  validate,
  execute,
}: ProtectedActionParams<TInput, TData>): Promise<ActionResult<TData>> {
  try {
    requireAuth(session);

    if (role) {
      requireRole(session, role);
    }

    const validatedInput = validate ? validate(input) : input;
    const data = await execute({ session, input: validatedInput });

    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: error.issues[0]?.message ?? "Invalid input",
        },
      };
    }

    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    throw error;
  }
}
