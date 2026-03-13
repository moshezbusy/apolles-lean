import type { PrismaClient } from "@prisma/client";

import { db } from "~/lib/db";
import { AppError, ErrorCodes } from "~/lib/errors";

export const MARKUP_PERCENTAGE_KEY = "markup_percentage";

type MarkupSettingsReader = Pick<PrismaClient, "platformSetting">;

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `${label} must be a non-negative number`,
    );
  }
}

function roundToCents(value: number): number {
  // NOTE: This Number.EPSILON approach is intentionally scoped to normal currency
  // ranges used by booking prices. It is not suitable for extremely large values.
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function applyMarkup(supplierAmount: number, markupPercentage: number): number {
  assertNonNegativeFinite(supplierAmount, "supplierAmount");
  assertNonNegativeFinite(markupPercentage, "markupPercentage");

  const markedUpAmount = supplierAmount * (1 + markupPercentage / 100);
  return roundToCents(markedUpAmount);
}

export async function getMarkupPercentage(
  prisma: MarkupSettingsReader = db,
): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: MARKUP_PERCENTAGE_KEY },
    select: { value: true },
  });

  if (!setting) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      "Platform markup setting is not configured",
    );
  }

  const parsedPercentage = Number(setting.value);

  if (!Number.isFinite(parsedPercentage) || parsedPercentage < 0) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      "Platform markup percentage is invalid",
    );
  }

  return parsedPercentage;
}
