import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "~/lib/db";
import { logSupplierApiCall, withSupplierApiLogging } from "~/features/suppliers/supplier-logger";

vi.mock("~/lib/db", () => ({
  db: {
    supplierApiLog: {
      create: vi.fn(),
    },
  },
}));

describe("supplier logger", () => {
  const mockedDb = db as unknown as {
    supplierApiLog: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes supplier API log rows", async () => {
    await logSupplierApiCall({
      supplier: "tbo",
      method: "search",
      endpoint: "/search",
      requestBody: { destination: "Rome" },
      responseBody: { hotels: [] },
      responseStatus: 200,
      durationMs: 123,
    });

    expect(mockedDb.supplierApiLog.create).toHaveBeenCalledWith({
      data: {
        supplier: "TBO",
        method: "search",
        endpoint: "/search",
        requestBody: { destination: "Rome" },
        responseBody: { hotels: [] },
        responseStatus: 200,
        durationMs: 123,
        errorMessage: undefined,
      },
    });
  });

  it("logs successful wrapped execution and returns data", async () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1150);

    const result = await withSupplierApiLogging({
      supplier: "expedia",
      method: "recheckPrice",
      endpoint: "/price-check",
      requestBody: { rateId: "rate-1" },
      execute: async () => ({
        data: { available: true },
        responseBody: { ok: true },
        responseStatus: 200,
      }),
    });

    expect(result).toEqual({ available: true });
    expect(mockedDb.supplierApiLog.create).toHaveBeenCalledWith({
      data: {
        supplier: "EXPEDIA",
        method: "recheckPrice",
        endpoint: "/price-check",
        requestBody: { rateId: "rate-1" },
        responseBody: { ok: true },
        responseStatus: 200,
        durationMs: 150,
        errorMessage: undefined,
      },
    });
  });

  it("logs failed wrapped execution and rethrows", async () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(2000).mockReturnValueOnce(2075);
    const supplierError = new Error("Timeout while calling supplier");

    await expect(
      withSupplierApiLogging({
        supplier: "tbo",
        method: "book",
        endpoint: "/book",
        requestBody: { rateId: "rate-1" },
        execute: async () => {
          throw supplierError;
        },
      }),
    ).rejects.toThrow("Timeout while calling supplier");

    expect(mockedDb.supplierApiLog.create).toHaveBeenCalledWith({
      data: {
        supplier: "TBO",
        method: "book",
        endpoint: "/book",
        requestBody: { rateId: "rate-1" },
        responseBody: undefined,
        responseStatus: undefined,
        durationMs: 75,
        errorMessage: "Timeout while calling supplier",
      },
    });
  });

  it("returns data even when success-path logging fails", async () => {
    mockedDb.supplierApiLog.create.mockRejectedValueOnce(new Error("DB unavailable"));

    const result = await withSupplierApiLogging({
      supplier: "tbo",
      method: "search",
      endpoint: "/search",
      execute: async () => ({
        data: { hotels: [] },
        responseBody: { hotels: [] },
        responseStatus: 200,
      }),
    });

    expect(result).toEqual({ hotels: [] });
    expect(mockedDb.supplierApiLog.create).toHaveBeenCalledTimes(1);
  });

  it("rethrows original supplier error when failure-path logging fails", async () => {
    const supplierError = new Error("Supplier timeout");
    mockedDb.supplierApiLog.create.mockRejectedValueOnce(new Error("DB unavailable"));

    await expect(
      withSupplierApiLogging({
        supplier: "expedia",
        method: "book",
        endpoint: "/book",
        execute: async () => {
          throw supplierError;
        },
      }),
    ).rejects.toBe(supplierError);
  });

  it("logs unknown error message for non-Error throws", async () => {
    await expect(
      withSupplierApiLogging({
        supplier: "expedia",
        method: "search",
        endpoint: "/search",
        execute: async () => {
          throw "string failure";
        },
      }),
    ).rejects.toBe("string failure");

    expect(mockedDb.supplierApiLog.create).toHaveBeenCalledWith({
      data: {
        supplier: "EXPEDIA",
        method: "search",
        endpoint: "/search",
        requestBody: undefined,
        responseBody: undefined,
        responseStatus: undefined,
        durationMs: expect.any(Number),
        errorMessage: "Unknown supplier error",
      },
    });
  });
});
