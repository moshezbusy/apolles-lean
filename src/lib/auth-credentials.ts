import { type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  role: Role;
};

type VerifyCredentialsParams = {
  email: string;
  password: string;
  findUserByEmail: (email: string) => Promise<AuthUserRecord | null>;
};

type VerifyCredentialsResult =
  | {
      status: "authenticated";
      user: AuthUserRecord;
    }
  | {
      status: "invalid" | "inactive";
    };

export async function verifyCredentials(
  params: VerifyCredentialsParams,
): Promise<VerifyCredentialsResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const user = await params.findUserByEmail(normalizedEmail);

  if (!user) {
    return { status: "invalid" };
  }

  const isPasswordValid = await bcrypt.compare(params.password, user.passwordHash);
  if (!isPasswordValid) {
    return { status: "invalid" };
  }

  if (!user.isActive) {
    return { status: "inactive" };
  }

  return {
    status: "authenticated",
    user,
  };
}
