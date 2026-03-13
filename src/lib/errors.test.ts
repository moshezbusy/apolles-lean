import { describe, expect, it } from "vitest";

import { AppError, ErrorCodes } from "~/lib/errors";

const expectedStatusByErrorCode = {
  [ErrorCodes.NOT_AUTHENTICATED]: 401,
  [ErrorCodes.NOT_AUTHORIZED]: 403,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.SUPPLIER_TIMEOUT]: 504,
  [ErrorCodes.SUPPLIER_ERROR]: 502,
  [ErrorCodes.RATE_UNAVAILABLE]: 409,
  [ErrorCodes.PRICE_CHANGED]: 409,
  [ErrorCodes.BOOKING_FAILED]: 500,
  [ErrorCodes.BOOKING_ALREADY_EXISTS]: 409,
} as const;

describe("AppError", () => {
  it("creates typed application errors", () => {
    const error = new AppError(ErrorCodes.NOT_AUTHENTICATED, "Not logged in");

    expect(error.code).toBe(ErrorCodes.NOT_AUTHENTICATED);
    expect(error.message).toBe("Not logged in");
    expect(error.statusCode).toBe(401);
    expect(error.isOperational).toBe(true);
  });

  it("allows overriding default status code", () => {
    const error = new AppError(
      ErrorCodes.BOOKING_FAILED,
      "Booking failed",
      503,
      false,
    );

    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(false);
  });

  it("extends Error and keeps AppError identity", () => {
    const error = new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid payload");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("maps every ErrorCode to the expected default HTTP status", () => {
    for (const code of Object.values(ErrorCodes)) {
      const error = new AppError(code, "test");
      expect(error.statusCode).toBe(expectedStatusByErrorCode[code]);
    }
  });
});
