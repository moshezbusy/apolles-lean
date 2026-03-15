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
                  RateKey: "tbo-rate-1",
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
                  RateKey: "tbo-rate-2",
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
          rateId: "tbo-rate-1",
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
      CheckInDate: "2026-08-01",
      CheckOutDate: "2026-08-05",
      CityName: "Rome",
      NoOfRooms: 1,
      RoomGuests: [
        {
          Adults: 2,
          Children: 1,
          ChildAge: [7],
        },
      ],
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
      CheckInDate: "2026-08-01",
      CheckOutDate: "2026-08-05",
      CityName: "Rome",
      NoOfRooms: 1,
      RoomGuests: [
        {
          Adults: 2,
          Children: 1,
          ChildAge: [7],
        },
      ],
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
      CheckInDate: "2026-08-01",
      CheckOutDate: "2026-08-05",
      CityName: "Rome",
      NoOfRooms: 1,
      RoomGuests: [
        {
          Adults: 2,
          Children: 0,
          ChildAge: [],
        },
      ],
    });
  });

  it("maps room guest payload for each requested room", async () => {
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
      rooms: 2,
      adults: 3,
      childrenAges: [4, 9],
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse((requestInit.body as string) ?? "{}");

    expect(requestBody.RoomGuests).toEqual([
      {
        Adults: 3,
        Children: 2,
        ChildAge: [4, 9],
      },
      {
        Adults: 3,
        Children: 2,
        ChildAge: [4, 9],
      },
    ]);
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

  it("returns RATE_UNAVAILABLE when TBO sends a business failure in a 200 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: {
            Code: 400,
            Description: "No availability for selected dates",
          },
          Hotels: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.RATE_UNAVAILABLE,
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
                  RateKey: "tbo-rate-3",
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
          rateId: "tbo-rate-3",
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

  it("keeps hotels that do not include an address", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: { Code: 200, Description: "Success" },
          Hotels: [
            {
              HotelCode: "TB-NO-ADDRESS",
              HotelName: "Address Optional Hotel",
              StarRating: 4,
              Images: ["https://images.trvl-media.com/address-optional.jpg"],
              Rooms: [
                {
                  RateKey: "tbo-rate-optional",
                  RoomName: "Standard",
                  MealPlan: "Room Only",
                  TotalFare: 149,
                  Currency: "USD",
                  IsRefundable: true,
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
        supplierHotelId: "TB-NO-ADDRESS",
        hotelName: "Address Optional Hotel",
        starRating: 4,
        images: ["https://images.trvl-media.com/address-optional.jpg"],
        lowestRate: {
          rateId: "tbo-rate-optional",
          supplierAmount: 149,
          currency: "USD",
          roomName: "Standard",
          mealPlan: "Room Only",
          cancellationPolicy: {
            isRefundable: true,
            freeCancellationUntil: null,
            description: "Refundable",
          },
          isCancellable: true,
        },
      },
    ]);
  });

  it("returns SUPPLIER_ERROR when all returned hotels are malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: { Code: 200, Description: "Success" },
          Hotels: [
            {
              HotelCode: "TB-INVALID-1",
              HotelName: "Broken Hotel One",
              Rooms: [],
            },
            {
              HotelCode: "TB-INVALID-2",
              HotelName: "Broken Hotel Two",
              Rooms: [{ RoomName: "Room Only" }],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(tboAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
      message: "Malformed TBO response payload",
    });
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
