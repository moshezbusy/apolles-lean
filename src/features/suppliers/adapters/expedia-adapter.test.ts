import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { expediaAdapter, EXPEDIA_SEARCH_ENDPOINT, EXPEDIA_TIMEOUT_MS } from "~/features/suppliers/adapters/expedia-adapter";
import { withSupplierApiLogging } from "~/features/suppliers/supplier-logger";
import { AppError, ErrorCodes } from "~/lib/errors";

vi.mock("~/features/suppliers/supplier-logger", () => ({
  withSupplierApiLogging: vi.fn(async ({ execute }) => {
    const execution = await execute();
    return execution.data;
  }),
}));

const SEARCH_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [6],
};

describe("expediaAdapter.search", () => {
  beforeEach(() => {
    process.env.EXPEDIA_API_KEY = "expedia-key";
    process.env.EXPEDIA_API_SECRET = "expedia-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("maps input, signs requests with SHA-512 auth, and normalizes successful responses", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              property_id: "EXP-1001",
              name: "Rome Central Hotel",
              star_rating: 4,
              address: { line1: "Rome, Italy" },
              images: [{ url: "https://example.com/expedia-rome.jpg" }],
              rates: [
                {
                  room_name: "Standard Room",
                  board_type: "Room Only",
                  total_price: { amount: 240, currency: "USD" },
                  refundable: true,
                  cancellation_policy: {
                    free_cancellation_until: "2026-07-30T00:00:00.000Z",
                    text: "Free cancellation before Jul 30",
                  },
                  metadata: {
                    tax_disclaimer_text:
                      "The taxes are tax recovery charges paid to vendors.",
                    cancellation_policy_text: "Free cancellation before Jul 30",
                    check_in_instructions: "Front desk open 24/7",
                    payment_processing_country: "US",
                  },
                },
                {
                  room_name: "Premium Room",
                  board_type: "Breakfast",
                  total_price: { amount: 300, currency: "USD" },
                  refundable: true,
                  cancellation_policy: {
                    free_cancellation_until: "2026-07-30T00:00:00.000Z",
                    text: "Free cancellation before Jul 30",
                  },
                  metadata: {
                    tax_disclaimer_text:
                      "The taxes are tax recovery charges paid to vendors.",
                    cancellation_policy_text: "Free cancellation before Jul 30",
                    check_in_instructions: "Front desk open 24/7",
                    payment_processing_country: "US",
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

    const result = await expediaAdapter.search(SEARCH_INPUT);

    expect(result).toEqual([
      {
        supplier: "expedia",
        supplierHotelId: "EXP-1001",
        hotelName: "Rome Central Hotel",
        starRating: 4,
        address: "Rome, Italy",
        images: ["https://example.com/expedia-rome.jpg"],
        lowestRate: {
          supplierAmount: 240,
          currency: "USD",
          roomName: "Standard Room",
          mealPlan: "Room Only",
          cancellationPolicy: {
            isRefundable: true,
            freeCancellationUntil: "2026-07-30T00:00:00.000Z",
            description: "Free cancellation before Jul 30",
          },
          isCancellable: true,
        },
        supplierMetadata: {
          expedia: {
            taxDisclaimerText:
              "The taxes are tax recovery charges paid to vendors.",
            cancellationPolicyText: "Free cancellation before Jul 30",
            checkInInstructions: "Front desk open 24/7",
            paymentProcessingCountry: "US",
          },
        },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const timestamp = "1700000000";
    const expectedSignature = createHash("sha512")
      .update(`expedia-keyexpedia-secret${timestamp}`)
      .digest("hex");

    expect(fetchMock).toHaveBeenCalledWith(
      EXPEDIA_SEARCH_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({
          "X-Expedia-Api-Key": "expedia-key",
          "X-Expedia-Timestamp": timestamp,
          "X-Expedia-Signature": expectedSignature,
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
      childrenAges: [6],
      children: 1,
    });

    expect(withSupplierApiLogging).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier: "expedia",
        method: "search",
        endpoint: EXPEDIA_SEARCH_ENDPOINT,
        requestBody,
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
    const fetchMock = vi.fn().mockResolvedValue(
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

  it("returns an empty array when supplier returns no hotels", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await expediaAdapter.search(SEARCH_INPUT);

    expect(result).toEqual([]);
  });

  it("keeps valid hotels when response contains malformed entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              property_id: "EXP-2001",
              name: "Valid Hotel",
              star_rating: 5,
              rates: [
                {
                  room_name: "Suite",
                  board_type: "Breakfast",
                  total_price: { amount: 500, currency: "USD" },
                  refundable: true,
                  cancellation_policy: {
                    text: "Free cancellation",
                    free_cancellation_until: "2026-07-30T00:00:00.000Z",
                  },
                },
              ],
            },
            {
              property_id: "EXP-BROKEN",
              name: "Malformed Hotel",
              star_rating: 4,
              rates: [
                {
                  room_name: "Broken",
                  board_type: "Room Only",
                  total_price: { amount: 100 },
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await expediaAdapter.search(SEARCH_INPUT);

    expect(result).toHaveLength(1);
    expect(result[0]?.supplierHotelId).toBe("EXP-2001");
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
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expediaAdapter.search(SEARCH_INPUT);

    expect(fetchMock).toHaveBeenCalledWith(
      EXPEDIA_SEARCH_ENDPOINT,
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Expedia-Api-Key": "validated-expedia-key",
        }),
      }),
    );

    vi.doUnmock("~/env");
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

    vi.doUnmock("~/env");
  });
});

describe("expediaAdapter non-search methods", () => {
  it("throws not-implemented AppError for getRoomDetails/recheckPrice/book", () => {
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
  });
});
