import { describe, expect, it, vi } from "vitest";

import { applyMarkup, getMarkupPercentage, MARKUP_PERCENTAGE_KEY } from "~/features/markup/markup-service";
import { AppError, ErrorCodes } from "~/lib/errors";

describe("applyMarkup", () => {
  it("returns the same amount for 0% markup", () => {
    expect(applyMarkup(100, 0)).toBe(100);
  });

  it("applies a typical 12% markup", () => {
    expect(applyMarkup(200, 12)).toBe(224);
  });

  it("applies a 0.1% edge-case markup", () => {
    expect(applyMarkup(100, 0.1)).toBe(100.1);
  });

  it("keeps zero supplier amount at zero", () => {
    expect(applyMarkup(0, 12)).toBe(0);
  });

  it("applies a 100% edge-case markup", () => {
    expect(applyMarkup(49.99, 100)).toBe(99.98);
  });

  it("rounds to cent precision with half-up behavior", () => {
    expect(applyMarkup(10.005, 0)).toBe(10.01);
    expect(applyMarkup(1.005, 10)).toBe(1.11);
  });

  it("throws VALIDATION_ERROR for negative amount", () => {
    expect(() => applyMarkup(-1, 12)).toThrowError(AppError);
    expect(() => applyMarkup(-1, 12)).toThrowError(/must be a non-negative number/i);
  });

  it("throws VALIDATION_ERROR for negative markup", () => {
    expect(() => applyMarkup(100, -1)).toThrowError(AppError);
    expect(() => applyMarkup(100, -1)).toThrowError(/must be a non-negative number/i);
  });
});

describe("getMarkupPercentage", () => {
  it("reads and parses markup percentage from platform settings", async () => {
    const dbMock = {
      platformSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "12" }),
      },
    };

    await expect(getMarkupPercentage(dbMock as never)).resolves.toBe(12);
    expect(dbMock.platformSetting.findUnique).toHaveBeenCalledWith({
      where: { key: MARKUP_PERCENTAGE_KEY },
      select: { value: true },
    });
  });

  it("throws VALIDATION_ERROR when markup setting is missing", async () => {
    const dbMock = {
      platformSetting: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(getMarkupPercentage(dbMock as never)).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
    });
  });

  it("throws VALIDATION_ERROR when markup setting is not numeric", async () => {
    const dbMock = {
      platformSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "not-a-number" }),
      },
    };

    await expect(getMarkupPercentage(dbMock as never)).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
    });
  });
});
