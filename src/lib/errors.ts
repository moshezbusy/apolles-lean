export const ErrorCodes = {
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SUPPLIER_TIMEOUT: "SUPPLIER_TIMEOUT",
  SUPPLIER_ERROR: "SUPPLIER_ERROR",
  RATE_UNAVAILABLE: "RATE_UNAVAILABLE",
  PRICE_CHANGED: "PRICE_CHANGED",
  BOOKING_FAILED: "BOOKING_FAILED",
  BOOKING_ALREADY_EXISTS: "BOOKING_ALREADY_EXISTS",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const STATUS_CODE_BY_ERROR: Record<ErrorCode, number> = {
  NOT_AUTHENTICATED: 401,
  NOT_AUTHORIZED: 403,
  VALIDATION_ERROR: 400,
  INTERNAL_ERROR: 500,
  SUPPLIER_TIMEOUT: 504,
  SUPPLIER_ERROR: 502,
  RATE_UNAVAILABLE: 409,
  PRICE_CHANGED: 409,
  BOOKING_FAILED: 500,
  BOOKING_ALREADY_EXISTS: 409,
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    public readonly code: ErrorCode,
    message: string,
    statusCode = STATUS_CODE_BY_ERROR[code],
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    "code" in error &&
    "statusCode" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  );
}
