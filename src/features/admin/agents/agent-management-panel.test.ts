import { describe, expect, it } from "vitest";

import {
  getFieldDescribedBy,
  getFirstInvalidField,
} from "~/features/admin/agents/agent-management-form";

describe("agent management panel helpers", () => {
  it("returns the first invalid field in form order", () => {
    expect(
      getFirstInvalidField({
        password: "Password is too weak",
        email: "Enter a valid email",
      }),
    ).toBe("email");
  });

  it("returns null when there are no field errors", () => {
    expect(getFirstInvalidField({})).toBeNull();
  });

  it("includes both hint and error ids for the password field", () => {
    expect(getFieldDescribedBy("password", true)).toBe("agent-password-hint agent-password-error");
  });

  it("includes only the field error id for non-password fields", () => {
    expect(getFieldDescribedBy("email", true)).toBe("agent-email-error");
  });
});
