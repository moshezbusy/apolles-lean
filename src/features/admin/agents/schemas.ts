import { z } from "zod";

const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must be at least 12 characters and include uppercase, lowercase, number, and special character";

export const createAgentInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(12, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(/[A-Z]/, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(/[a-z]/, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(/[0-9]/, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(/[^A-Za-z0-9]/, PASSWORD_COMPLEXITY_MESSAGE),
});

export const setAgentStatusInputSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  isActive: z.boolean(),
});

export type CreateAgentInput = z.infer<typeof createAgentInputSchema>;
export type SetAgentStatusInput = z.infer<typeof setAgentStatusInputSchema>;
