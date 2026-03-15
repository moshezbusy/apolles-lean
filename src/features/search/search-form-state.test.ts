import { describe, expect, it } from "vitest";

import {
  beginSearch,
  getSupplierFailures,
  INITIAL_SEARCH_UI_STATE,
  resolveSearchError,
  resolveSearchResult,
} from "~/features/search/search-form-state";

const BASE_SUPPLIER_STATUS = {
  tbo: "success" as const,
  expedia: "success" as const,
};

describe("search-form-state", () => {
  it("transitions from idle to loading on submit", () => {
    expect(INITIAL_SEARCH_UI_STATE.status).toBe("idle");
    expect(beginSearch().status).toBe("loading");
  });

  it("transitions from loading to success with result cards", () => {
    const next = resolveSearchResult({
      results: [
        {
          supplier: "tbo",
          supplierHotelId: "TB-001",
          hotelName: "Hotel Roma",
          starRating: 4,
          address: "Rome",
          images: [],
          lowestRate: {
            rateId: "rate-1",
            supplierAmount: 120,
            displayAmount: 120,
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
      ],
      supplierStatus: BASE_SUPPLIER_STATUS,
    });

    expect(next.status).toBe("success");
    expect(next.results).toHaveLength(1);
    expect(next.supplierStatus).toEqual(BASE_SUPPLIER_STATUS);
  });

  it("transitions from loading to empty when no results are returned", () => {
    const next = resolveSearchResult({
      results: [],
      supplierStatus: {
        tbo: "failed",
        expedia: "success",
      },
    });

    expect(next.status).toBe("empty");
    expect(next.results).toEqual([]);
    expect(getSupplierFailures(next.supplierStatus)).toEqual(["tbo"]);
  });

  it("transitions from loading to error when action fails", () => {
    const next = resolveSearchError("Supplier request failed");

    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("Supplier request failed");
    expect(next.results).toEqual([]);
  });

  it("transitions from loading to error when both suppliers fail", () => {
    const next = resolveSearchResult({
      results: [],
      supplierStatus: {
        tbo: "failed",
        expedia: "failed",
      },
    });

    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("Unable to load results. Please try again.");
  });
});
