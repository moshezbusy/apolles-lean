import { describe, expect, it } from "vitest";

import { createAgentInputSchema, setAgentStatusFormSchema } from "~/features/admin/agents/schemas";

describe("createAgentInputSchema", () => {
  const baseInput = {
    name: "Agent One",
    email: "agent@example.com",
    password: "StrongPassword1!",
  };

  it("accepts a password that satisfies complexity requirements", () => {
    const result = createAgentInputSchema.safeParse(baseInput);

    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 12 characters", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      password: "Short1!a",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password missing special character", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      password: "StrongPassword12",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password missing uppercase character", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      password: "strongpassword1!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password missing lowercase character", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      password: "STRONGPASSWORD1!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password missing digit", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      password: "StrongPassword!!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createAgentInputSchema.safeParse({
      ...baseInput,
      name: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("setAgentStatusFormSchema", () => {
  it("accepts explicit boolean-like string values", () => {
    expect(
      setAgentStatusFormSchema.safeParse({
        userId: crypto.randomUUID(),
        isActive: "true",
      }).success,
    ).toBe(true);

    expect(
      setAgentStatusFormSchema.safeParse({
        userId: crypto.randomUUID(),
        isActive: "false",
      }).success,
    ).toBe(true);
  });

  it("rejects unexpected status values", () => {
    const result = setAgentStatusFormSchema.safeParse({
      userId: crypto.randomUUID(),
      isActive: "maybe",
    });

    expect(result.success).toBe(false);
  });
});
