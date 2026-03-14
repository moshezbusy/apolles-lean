import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  expediaAdapter,
  EXPEDIA_AVAILABILITY_ENDPOINT,
  EXPEDIA_CONTENT_ENDPOINT,
  EXPEDIA_REGION_ENDPOINT,
  EXPEDIA_TIMEOUT_MS,
} from "~/features/suppliers/adapters/expedia-adapter";
import {
  isLoggedSupplierError,
  withSupplierApiLogging,
} from "~/features/suppliers/supplier-logger";
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
  destination: "region:602962",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [6],
};

function getAuthHeader(timestamp: string) {
  const signature = createHash("sha512")
    .update(`expedia-keyexpedia-secret${timestamp}`)
    .digest("hex");

  return `EAN APIKey=expedia-key,Signature=${signature},timestamp=${timestamp}`;
}

describe("expediaAdapter.search", () => {
  beforeEach(() => {
    process.env.EXPEDIA_API_KEY = "expedia-key";
    process.env.EXPEDIA_API_SECRET = "expedia-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.doUnmock("~/env");
  });

  it("uses Rapid auth, region property mapping, and normalized availability/content responses", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            property_ids_expanded: ["19248"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "19248": {
              property_id: "19248",
              name: "Rome Central Hotel",
              address: { line_1: "Rome, Italy", city: "Rome", country_code: "IT" },
              ratings: { property: { rating: "4.0" } },
              images: [{ links: { "70px": { href: "https://example.com/expedia-rome.jpg" } } }],
              checkin: {
                instructions: "Front desk open 24/7",
                special_instructions: "Ring bell after midnight",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              property_id: "19248",
              status: "available",
              rooms: [
                {
                  id: "room-1",
                  room_name: "Standard Room",
                  rates: [
                    {
                      id: "rate-1",
                      status: "available",
                      refundable: true,
                      current_refundability: "refundable",
                      merchant_of_record: "expedia",
                      amenities: {
                        meal: { name: "Room Only" },
                      },
                      cancel_penalties: [
                        {
                          start: "2026-07-30T00:00:00.000Z",
                          amount: "10.00",
                        },
                      ],
                      occupancy_pricing: {
                        "2-6": {
                          totals: {
                            property_inclusive: {
                              request_currency: {
                                value: "240.00",
                                currency: "USD",
                              },
                            },
                          },
                        },
                      },
                    },
                    {
                      id: "rate-2",
                      status: "available",
                      refundable: false,
                      current_refundability: "non_refundable",
                      occupancy_pricing: {
                        "2-6": {
                          totals: {
                            property_inclusive: {
                              request_currency: {
                                value: "300.00",
                                currency: "USD",
                              },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await expediaAdapter.search(SEARCH_INPUT);

    expect(result).toEqual([
      {
        supplier: "expedia",
        supplierHotelId: "19248",
        hotelName: "Rome Central Hotel",
        starRating: 4,
        address: "Rome, Italy, Rome",
        images: ["https://example.com/expedia-rome.jpg"],
        lowestRate: {
          supplierAmount: 240,
          currency: "USD",
          roomName: "Standard Room",
          mealPlan: "Room Only",
          cancellationPolicy: {
            isRefundable: true,
            freeCancellationUntil: "2026-07-30T00:00:00.000Z",
            description: "Free cancellation until 2026-07-30T00:00:00.000Z",
          },
          isCancellable: true,
        },
        supplierMetadata: {
          expedia: {
            cancellationPolicyText: "Free cancellation until 2026-07-30T00:00:00.000Z",
            checkInInstructions: "Front desk open 24/7",
            paymentProcessingCountry: "IT",
          },
        },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const timestamp = "1700000000";
    const expectedAuth = getAuthHeader(timestamp);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${EXPEDIA_REGION_ENDPOINT}/602962?language=en-US&supply_source=expedia&include=property_ids_expanded`,
      expect.objectContaining({
        method: "GET",
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          Authorization: expectedAuth,
          "User-Agent": "Apolles/0.1.0",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${EXPEDIA_CONTENT_ENDPOINT}?language=en-US&supply_source=expedia&include=name&include=address&include=images&include=ratings&include=checkin&property_id=19248`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: expectedAuth }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${EXPEDIA_AVAILABILITY_ENDPOINT}?checkin=2026-08-01&checkout=2026-08-05&currency=USD&country_code=US&language=en-US&rate_plan_count=1&sales_channel=agent_tool&sales_environment=hotel_only&occupancy=2-6&property_id=19248`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: expectedAuth }),
      }),
    );

    expect(withSupplierApiLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier: "expedia",
        method: "search",
        endpoint: EXPEDIA_AVAILABILITY_ENDPOINT,
      }),
    );
  });

  it("returns SUPPLIER_TIMEOUT on timeout/abort", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(expediaAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_TIMEOUT,
    });

    expect(EXPEDIA_TIMEOUT_MS).toBe(5000);
  });

  it("returns SUPPLIER_ERROR when Expedia auth fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(expediaAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
      message: "Expedia authentication failed",
    });
  });

  it("returns SUPPLIER_ERROR when Expedia returns 403", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(expediaAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
      message: "Expedia authentication failed",
    });
  });

  it("returns SUPPLIER_ERROR on malformed payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ property_ids_expanded: ["19248"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ "19248": { name: "Rome Central Hotel" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(expediaAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
    });
  });

  it("returns an empty array when the resolved region has no properties", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ property_ids_expanded: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await expediaAdapter.search(SEARCH_INPUT);

    expect(result).toEqual([]);
  });

  it("keeps valid hotels when availability response contains malformed entries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ property_ids_expanded: ["19248", "99999"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "19248": {
              name: "Valid Hotel",
              address: { line_1: "Valid Address", city: "Rome", country_code: "IT" },
              ratings: { property: { rating: "5.0" } },
            },
            "99999": {
              name: "Broken Hotel",
              address: { line_1: "Broken Address", city: "Rome", country_code: "IT" },
              ratings: { property: { rating: "4.0" } },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              property_id: "19248",
              rooms: [
                {
                  room_name: "Suite",
                  rates: [
                    {
                      refundable: true,
                      occupancy_pricing: {
                        "2-6": {
                          totals: {
                            property_inclusive: {
                              request_currency: { value: "500.00", currency: "USD" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              property_id: "99999",
              rooms: [{ room_name: "Broken", rates: [{}] }],
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await expediaAdapter.search(SEARCH_INPUT);

    expect(result).toHaveLength(1);
    expect(result[0]?.supplierHotelId).toBe("19248");
  });

  it("returns RATE_UNAVAILABLE for no-availability supplier failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "No availability for selected dates",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(expediaAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.RATE_UNAVAILABLE,
    });
  });

  it("falls back to validated env credentials when process env is missing", async () => {
    delete process.env.EXPEDIA_API_KEY;
    delete process.env.EXPEDIA_API_SECRET;

    vi.doMock("~/env", () => ({
      env: {
        EXPEDIA_API_KEY: "validated-expedia-key",
        EXPEDIA_API_SECRET: "validated-expedia-secret",
      },
    }));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ property_ids_expanded: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expediaAdapter.search(SEARCH_INPUT);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${EXPEDIA_REGION_ENDPOINT}/602962`),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("EAN APIKey=validated-expedia-key"),
        }),
      }),
    );
  });

  it("throws SUPPLIER_ERROR when credentials are missing", async () => {
    delete process.env.EXPEDIA_API_KEY;
    delete process.env.EXPEDIA_API_SECRET;
    vi.doMock("~/env", () => {
      throw new Error("env unavailable");
    });
    vi.stubGlobal("fetch", vi.fn());

    await expect(expediaAdapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: ErrorCodes.SUPPLIER_ERROR,
    });
  });

  it("throws SUPPLIER_ERROR when destination is not a mapped Expedia identifier", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              region_id: "602962",
              property_ids_expanded: ["19248"],
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "19248": {
              name: "Rome Central Hotel",
              address: { line_1: "Rome, Italy", city: "Rome", country_code: "IT" },
              ratings: { property: { rating: "4.0" } },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              property_id: "19248",
              rooms: [
                {
                  room_name: "Standard Room",
                  rates: [
                    {
                      refundable: true,
                      occupancy_pricing: {
                        "2-6": {
                          totals: {
                            property_inclusive: {
                              request_currency: { value: "240.00", currency: "USD" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await expediaAdapter.search({
      ...SEARCH_INPUT,
      destination: "Rome",
    });

    expect(result).toHaveLength(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${EXPEDIA_REGION_ENDPOINT}?language=en-US&supply_source=expedia&include=property_ids_expanded&query=Rome`,
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});

describe("expediaAdapter non-search methods", () => {
  it("throws not-implemented AppError for getRoomDetails/recheckPrice/book/cancel/getBookingDetail", () => {
    expect(() =>
      expediaAdapter.getRoomDetails({
        supplierHotelId: "EXP-1001",
        checkIn: "2026-08-01",
        checkOut: "2026-08-05",
        adults: 2,
        childrenAges: [],
      }),
    ).toThrow(AppError);

    expect(() =>
      expediaAdapter.recheckPrice({
        supplierHotelId: "EXP-1001",
        rateId: "rate-1",
        checkIn: "2026-08-01",
        checkOut: "2026-08-05",
      }),
    ).toThrow(AppError);

    expect(() =>
      expediaAdapter.book({
        supplierHotelId: "EXP-1001",
        rateId: "rate-1",
        idempotencyKey: "idem-1",
        guests: [{ fullName: "Test Guest" }],
      }),
    ).toThrow(AppError);

    expect(() =>
      expediaAdapter.cancel({
        supplierBookingReference: "EXP-BOOKING-1",
      }),
    ).toThrow(AppError);

    expect(() =>
      expediaAdapter.getBookingDetail({
        supplierBookingReference: "EXP-BOOKING-1",
      }),
    ).toThrow(AppError);
  });
});
