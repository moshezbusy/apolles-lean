import { describe, expect, it } from "vitest";

import { AppError, ErrorCodes } from "~/lib/errors";

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
});
