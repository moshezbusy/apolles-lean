import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEARCH_TIMEOUT_MS, searchHotels } from "~/features/search/search-service";
import { expediaAdapter } from "~/features/suppliers/adapters/expedia-adapter";
import { tboAdapter } from "~/features/suppliers/adapters/tbo-adapter";
import { applyMarkup, getMarkupPercentage } from "~/features/markup/markup-service";
import { AppError, ErrorCodes } from "~/lib/errors";

vi.mock("~/features/suppliers/adapters/tbo-adapter", () => ({
  tboAdapter: {
    search: vi.fn(),
  },
}));

vi.mock("~/features/suppliers/adapters/expedia-adapter", () => ({
  expediaAdapter: {
    search: vi.fn(),
  },
}));

vi.mock("~/features/markup/markup-service", () => ({
  getMarkupPercentage: vi.fn(),
  applyMarkup: vi.fn(),
}));

const SEARCH_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [7],
};

const TBO_RESULT = {
  supplier: "tbo" as const,
  supplierHotelId: "TB-001",
  hotelName: "Rome Grand",
  starRating: 4,
  address: "Rome, Italy",
  images: ["https://example.com/tbo.jpg"],
  lowestRate: {
    supplierAmount: 100,
    currency: "USD",
    roomName: "Standard",
    mealPlan: "Room Only",
    cancellationPolicy: {
      isRefundable: true,
      freeCancellationUntil: "2026-07-25T00:00:00.000Z",
      description: "Free cancellation",
    },
    isCancellable: true,
  },
};

const EXPEDIA_RESULT = {
  supplier: "expedia" as const,
  supplierHotelId: "EXP-001",
  hotelName: "Rome Central",
  starRating: 5,
  address: "Rome, Italy",
  images: ["https://example.com/expedia.jpg"],
  lowestRate: {
    supplierAmount: 200,
    currency: "USD",
    roomName: "Deluxe",
    mealPlan: "Breakfast",
    cancellationPolicy: {
      isRefundable: false,
      freeCancellationUntil: null,
      description: "Non-refundable",
    },
    isCancellable: false,
  },
};

describe("searchHotels", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getMarkupPercentage).mockResolvedValue(12);
    vi.mocked(applyMarkup).mockImplementation((amount, markupPercentage) =>
      Math.round((amount * (1 + markupPercentage / 100) + Number.EPSILON) * 100) / 100,
    );
  });

  it("returns flat combined results with markup when both suppliers succeed", async () => {
    vi.mocked(tboAdapter.search).mockResolvedValue([TBO_RESULT]);
    vi.mocked(expediaAdapter.search).mockResolvedValue([EXPEDIA_RESULT]);

    const result = await searchHotels(SEARCH_INPUT);

    expect(result.supplierStatus).toEqual({
      tbo: "success",
      expedia: "success",
    });

    expect(result.results).toEqual([
      {
        ...TBO_RESULT,
        lowestRate: {
          ...TBO_RESULT.lowestRate,
          supplierAmount: 112,
          displayAmount: 112,
        },
      },
      {
        ...EXPEDIA_RESULT,
        lowestRate: {
          ...EXPEDIA_RESULT.lowestRate,
          supplierAmount: 224,
          displayAmount: 224,
        },
      },
    ]);

    expect(getMarkupPercentage).toHaveBeenCalledTimes(1);
    expect(applyMarkup).toHaveBeenCalledTimes(2);
    expect(applyMarkup).toHaveBeenNthCalledWith(1, 100, 12);
    expect(applyMarkup).toHaveBeenNthCalledWith(2, 200, 12);
  });

  it("returns successful supplier results and failed status when one supplier times out", async () => {
    vi.mocked(tboAdapter.search).mockRejectedValue(
      new AppError(ErrorCodes.SUPPLIER_TIMEOUT, "Timed out"),
    );
    vi.mocked(expediaAdapter.search).mockResolvedValue([EXPEDIA_RESULT]);

    const result = await searchHotels(SEARCH_INPUT);

    expect(result.supplierStatus).toEqual({
      tbo: "failed",
      expedia: "success",
    });
    expect(result.results).toEqual([
      {
        ...EXPEDIA_RESULT,
        lowestRate: {
          ...EXPEDIA_RESULT.lowestRate,
          supplierAmount: 224,
          displayAmount: 224,
        },
      },
    ]);
  });

  it("returns successful supplier results and failed status when one supplier errors", async () => {
    vi.mocked(tboAdapter.search).mockResolvedValue([TBO_RESULT]);
    vi.mocked(expediaAdapter.search).mockRejectedValue(
      new AppError(ErrorCodes.SUPPLIER_ERROR, "Expedia failed"),
    );

    const result = await searchHotels(SEARCH_INPUT);

    expect(result.supplierStatus).toEqual({
      tbo: "success",
      expedia: "failed",
    });
    expect(result.results).toEqual([
      {
        ...TBO_RESULT,
        lowestRate: {
          ...TBO_RESULT.lowestRate,
          supplierAmount: 112,
          displayAmount: 112,
        },
      },
    ]);
  });

  it("keeps results flat and supplier-specific when both suppliers return multiple hotels", async () => {
    vi.mocked(tboAdapter.search).mockResolvedValue([TBO_RESULT, { ...TBO_RESULT, supplierHotelId: "TB-002" }]);
    vi.mocked(expediaAdapter.search).mockResolvedValue([
      EXPEDIA_RESULT,
      { ...EXPEDIA_RESULT, supplierHotelId: "EXP-002" },
    ]);

    const result = await searchHotels(SEARCH_INPUT);

    expect(result.results).toHaveLength(4);
    expect(result.results.every((entry) => !Array.isArray(entry))).toBe(true);
    expect(result.results.map((entry) => entry.supplier)).toEqual([
      "tbo",
      "tbo",
      "expedia",
      "expedia",
    ]);
  });

  it("marks a supplier failed when its search exceeds the story timeout budget", async () => {
    vi.useFakeTimers();

    vi.mocked(tboAdapter.search).mockImplementation(
      () => new Promise(() => undefined),
    );
    vi.mocked(expediaAdapter.search).mockResolvedValue([EXPEDIA_RESULT]);

    const resultPromise = searchHotels(SEARCH_INPUT);

    await vi.advanceTimersByTimeAsync(SEARCH_TIMEOUT_MS);

    const result = await resultPromise;

    expect(result.supplierStatus).toEqual({
      tbo: "failed",
      expedia: "success",
    });
    expect(result.results).toHaveLength(1);

    vi.useRealTimers();
  });

  it("returns empty results with both suppliers failed when both reject", async () => {
    vi.mocked(tboAdapter.search).mockRejectedValue(
      new AppError(ErrorCodes.SUPPLIER_TIMEOUT, "TBO timed out"),
    );
    vi.mocked(expediaAdapter.search).mockRejectedValue(
      new AppError(ErrorCodes.SUPPLIER_ERROR, "Expedia failed"),
    );

    const result = await searchHotels(SEARCH_INPUT);

    expect(result).toEqual({
      results: [],
      supplierStatus: {
        tbo: "failed",
        expedia: "failed",
      },
    });
    expect(getMarkupPercentage).not.toHaveBeenCalled();
    expect(applyMarkup).not.toHaveBeenCalled();
  });
});
