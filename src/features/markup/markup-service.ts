import type { PrismaClient } from "@prisma/client";

import { db } from "~/lib/db";
import { AppError, ErrorCodes } from "~/lib/errors";

export const MARKUP_PERCENTAGE_KEY = "markup_percentage";
export const MAX_MARKUP_PERCENTAGE = 100;

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
  return Number(Math.round(Number(`${value}e2`)) + "e-2");
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

  if (
    !Number.isFinite(parsedPercentage) ||
    parsedPercentage < 0 ||
    parsedPercentage > MAX_MARKUP_PERCENTAGE
  ) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `Platform markup percentage must be between 0 and ${MAX_MARKUP_PERCENTAGE}`,
    );
  }

  return parsedPercentage;
}
