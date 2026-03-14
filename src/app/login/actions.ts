"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "~/lib/auth";
import { normalizeCallbackUrl } from "~/lib/auth-routing";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const INACTIVE_ACCOUNT_MESSAGE = "Account is inactive";
const DEFAULT_REDIRECT = "/search";

export type LoginState = {
  error: string | null;
};

function getRedirectTarget(formData: FormData) {
  return normalizeCallbackUrl(formData.get("callbackUrl") as string | null);
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: getRedirectTarget(formData),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // InactiveAccountError has code "inactive_account" (see auth.ts)
      if ("code" in error && error.code === "inactive_account") {
        return { error: INACTIVE_ACCOUNT_MESSAGE };
      }
      return { error: INVALID_CREDENTIALS_MESSAGE };
    }

    // Re-throw non-AuthError errors — this includes the NEXT_REDIRECT
    // "error" that Next.js Server Actions use for successful redirects.
    throw error;
  }

  return { error: null };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
