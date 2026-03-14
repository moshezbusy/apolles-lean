import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLoggedSupplierError,
  isLoggedSupplierError,
  withSupplierApiLogging,
} from "~/features/suppliers/supplier-logger";
import { tboAdapter, TBO_SEARCH_ENDPOINT, TBO_TIMEOUT_MS } from "~/features/suppliers/adapters/tbo-adapter";
import { AppError, ErrorCodes } from "~/lib/errors";

vi.mock("~/features/suppliers/supplier-logger", () => ({
  createLoggedSupplierError: vi.fn((error, metadata) => ({
    ...metadata,
    cause: error,
    message: error.message,
    name: "LoggedSupplierApiError",
  })),
  isLoggedSupplierError: vi.fn((error) => error?.name === "LoggedSupplierApiError"),
  withSupplierApiLogging: vi.fn(async ({ execute }) => {
    try {
      const execution = await execute();
      return execution.data;
    } catch (error) {
      if (isLoggedSupplierError(error)) {
        throw error.cause;
      }

      throw error;
    }
  }),
}));

const SEARCH_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [7],
};

describe("tboAdapter.search", () => {
  beforeEach(() => {
    process.env.TBO_API_KEY = "tbo-key";
    process.env.TBO_API_SECRET = "tbo-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps input, authenticates with Basic Auth, normalizes successful responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: { Code: 200, Description: "Success" },
          Hotels: [
            {
              HotelCode: "TB-001",
              HotelName: "Rome Grand",
              StarRating: 4,
              Address: "Rome, Italy",
              Images: ["https://example.com/rome.jpg"],
              Rooms: [
                {
                  RoomName: "Standard Room",
                  MealPlan: "Room Only",
                  TotalFare: 110,
                  Currency: "USD",
                  CancellationPolicy: {
                    IsRefundable: true,
                    Description: "Free cancellation",
                    FreeCancellationUntil: "2026-07-28T00:00:00.000Z",
                  },
                },
                {
                  RoomName: "Deluxe Room",
                  MealPlan: "Breakfast",
                  TotalFare: 150,
                  Currency: "USD",
                  CancellationPolicy: {
                    IsRefundable: true,
                    Description: "Free cancellation",
                    FreeCancellationUntil: "2026-07-28T00:00:00.000Z",
                  },
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await tboAdapter.search(SEARCH_INPUT);

    expect(result).toEqual([
      {
        supplier: "tbo",
        supplierHotelId: "TB-001",
        hotelName: "Rome Grand",
        starRating: 4,
        address: "Rome, Italy",
        images: ["https://example.com/rome.jpg"],
        lowestRate: {
          supplierAmount: 110,
          currency: "USD",
          roomName: "Standard Room",
          mealPlan: "Room Only",
          cancellationPolicy: {
            isRefundable: true,
            freeCancellationUntil: "2026-07-28T00:00:00.000Z",
            description: "Free cancellation",
          },
          isCancellable: true,
        },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      TBO_SEARCH_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from("tbo-key:tbo-secret").toString("base64")}`,
          "Content-Type": "application/json",
        }),
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse((requestInit.body as string) ?? "{}");

    expect(requestBody).toEqual({
      destination: "Rome",
      checkIn: "2026-08-01",
      checkOut: "2026-08-05",
      rooms: 1,
      adults: 2,
      children: 1,
      childrenAges: [7],
    });

    expect(withSupplierApiLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier: "tbo",
        method: "search",
        endpoint: TBO_SEARCH_ENDPOINT,
        requestBody,
      }),
    );

    const loggerParams = vi.mocked(withSupplierApiLogging).mock.calls[0]?.[0];
    expect(loggerParams?.requestBody).toEqual({
      destination: "Rome",
      checkIn: "2026-08-01",
      checkOut: "2026-08-05",
      rooms: 1,
      adults: 2,
      children: 1,
      childrenAges: [7],
    });
  });

  it("maps children count as zero when childrenAges is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: { Code: 200, Description: "Success" },
          Hotels: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await tboAdapter.search({
      ...SEARCH_INPUT,
      childrenAges: [],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse((requestInit.body as string) ?? "{}");

    expect(requestBody).toEqual({
      destination: "Rome",
      checkIn: "2026-08-01",
      checkOut: "2026-08-05",
      rooms: 1,
      adults: 2,
      children: 0,
      childrenAges: [],
    });
  });

  it("returns SUPPLIER_TIMEOUT on timeout/abort", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_TIMEOUT,
    });

    expect(TBO_TIMEOUT_MS).toBe(5000);
  });

  it("returns SUPPLIER_ERROR when TBO auth fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
      message: "TBO authentication failed",
    });
  });

  it("returns SUPPLIER_ERROR on malformed payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ Status: { Code: 200 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
    });
  });

  it("skips malformed hotels and keeps valid results", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: { Code: 200, Description: "Success" },
          Hotels: [
            {
              HotelCode: "TB-INVALID",
              HotelName: "Broken Hotel",
              StarRating: 3,
              Rooms: [],
            },
            {
              HotelCode: "TB-VALID",
              HotelName: "Valid Hotel",
              StarRating: 4,
              Address: "Rome",
              Images: ["https://example.com/valid.jpg"],
              Rooms: [
                {
                  RoomName: "Standard",
                  MealPlan: "Room Only",
                  TotalFare: 99,
                  Currency: "USD",
                  IsRefundable: false,
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).resolves.toEqual([
      {
        supplier: "tbo",
        supplierHotelId: "TB-VALID",
        hotelName: "Valid Hotel",
        starRating: 4,
        address: "Rome",
        images: ["https://example.com/valid.jpg"],
        lowestRate: {
          supplierAmount: 99,
          currency: "USD",
          roomName: "Standard",
          mealPlan: "Room Only",
          cancellationPolicy: {
            isRefundable: false,
            freeCancellationUntil: null,
            description: "Non-refundable",
          },
          isCancellable: false,
        },
      },
    ]);
  });

  it("returns an empty array when supplier returns no hotels", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: { Code: 200, Description: "Success" },
          Hotels: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await tboAdapter.search(SEARCH_INPUT);

    expect(result).toEqual([]);
  });

  it("returns RATE_UNAVAILABLE for no-availability supplier failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: {
            Code: 500,
            Description: "No availability for selected dates",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.RATE_UNAVAILABLE,
    });
  });

  it("throws SUPPLIER_ERROR when credentials are missing", async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    delete process.env.TBO_API_KEY;
    delete process.env.TBO_API_SECRET;
    vi.stubGlobal("fetch", vi.fn());

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
    });

    delete process.env.SKIP_ENV_VALIDATION;
  });
});

describe("tboAdapter non-search methods", () => {
  it("throws not-implemented AppError for getRoomDetails/recheckPrice/book/cancel/getBookingDetail", () => {
    expect(() =>
      tboAdapter.getRoomDetails({
        supplierHotelId: "TB-001",
        checkIn: "2026-08-01",
        checkOut: "2026-08-05",
        adults: 2,
        childrenAges: [],
      }),
    ).toThrow(AppError);

    expect(() =>
      tboAdapter.recheckPrice({
        supplierHotelId: "TB-001",
        rateId: "rate-1",
        checkIn: "2026-08-01",
        checkOut: "2026-08-05",
      }),
    ).toThrow(AppError);

    expect(() =>
      tboAdapter.book({
        supplierHotelId: "TB-001",
        rateId: "rate-1",
        idempotencyKey: "idem-1",
        guests: [{ fullName: "Test Guest" }],
      }),
    ).toThrow(AppError);

    expect(() =>
      tboAdapter.cancel({
        supplierBookingReference: "TB-BOOKING-1",
      }),
    ).toThrow(AppError);

    expect(() =>
      tboAdapter.getBookingDetail({
        supplierBookingReference: "TB-BOOKING-1",
      }),
    ).toThrow(AppError);
  });
});
