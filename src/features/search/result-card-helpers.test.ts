import { describe, expect, it } from "vitest";

import {
  buildBookHref,
  buildHotelAriaLabel,
  buildViewRoomsHref,
  formatCancellationBadge,
  getPrimaryHotelImage,
} from "~/features/search/result-card-helpers";

const SEARCH_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [7],
};

const HOTEL = {
  supplier: "expedia" as const,
  supplierHotelId: "19248",
  hotelName: "Rome Central",
  starRating: 4,
  address: "Rome, Italy",
  images: ["https://images.trvl-media.com/rome.jpg", "http://unsupported.example.org/rome.jpg"],
  lowestRate: {
    rateId: "rate-1",
    supplierAmount: 200,
    displayAmount: 224,
    currency: "USD",
    roomName: "Deluxe Room",
    mealPlan: "Breakfast Included",
    cancellationPolicy: {
      isRefundable: true,
      freeCancellationUntil: "2026-07-30T00:00:00.000Z",
      description: "Free cancellation",
    },
    isCancellable: true,
  },
};

describe("result-card-helpers", () => {
  it("formats the accessibility label with the agent-facing price", () => {
    expect(buildHotelAriaLabel(HOTEL)).toBe("Rome Central, 4 stars, from $224.00");
  });

  it("formats free-cancel and non-refundable badge copy", () => {
    expect(formatCancellationBadge(HOTEL.lowestRate.cancellationPolicy)).toBe("Free cancel until Jul 30, 2026");
    expect(
      formatCancellationBadge({
        isRefundable: false,
        freeCancellationUntil: null,
        description: "Non-refundable",
      }),
    ).toBe("Non-refundable");
  });

  it("keeps only https remote imagery and builds stable route hrefs", () => {
    expect(getPrimaryHotelImage(HOTEL)).toBe("https://images.trvl-media.com/rome.jpg");
    expect(buildViewRoomsHref(HOTEL, SEARCH_INPUT, "Source B")).toBe(
      "/search/expedia/19248?checkIn=2026-08-01&checkOut=2026-08-05&adults=2&rooms=1&sourceLabel=Source+B&childAge=7",
    );
    expect(buildBookHref(HOTEL, SEARCH_INPUT, "Source B")).toBe(
      "/booking/expedia/19248/rate-1?checkIn=2026-08-01&checkOut=2026-08-05&adults=2&rooms=1&sourceLabel=Source+B&childAge=7",
    );
  });
});
