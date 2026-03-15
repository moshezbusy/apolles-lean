/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ fill: _fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { HotelResultCard } from "~/features/search/hotel-result-card";
import { createSourceLabelMap } from "~/features/search/source-labels";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const SEARCH_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [7],
};

const SOURCE_LABELS = createSourceLabelMap("tbo");

const BASE_HOTEL = {
  supplier: "tbo" as const,
  supplierHotelId: "TB-001",
  hotelName: "Hotel Roma",
  starRating: 4,
  address: "Rome, Italy",
  images: ["https://example.com/hotel.jpg"],
  lowestRate: {
    rateId: "rate-1",
    supplierAmount: 120,
    displayAmount: 135,
    currency: "USD",
    roomName: "Deluxe Room",
    mealPlan: "Breakfast Included",
    cancellationPolicy: {
      isRefundable: true,
      freeCancellationUntil: "2026-07-28T00:00:00.000Z",
      description: "Free cancellation",
    },
    isCancellable: true,
  },
};

describe("HotelResultCard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });

    container.remove();
  });

  it("renders hotel metadata, source label, accessibility copy, and route-safe actions", async () => {
    await act(async () => {
      root.render(<HotelResultCard hotel={BASE_HOTEL} searchInput={SEARCH_INPUT} sourceLabels={SOURCE_LABELS} />);
    });

    expect(container.textContent).toContain("Hotel Roma");
    expect(container.textContent).toContain("Source A");
    expect(container.textContent).toContain("Breakfast Included");
    expect(container.textContent).toContain("Free cancel until Jul 28, 2026");
    expect(container.textContent).toContain("$135.00");
    expect(container.textContent).toContain("Rome, Italy");

    const article = container.querySelector("article");
    expect(article?.getAttribute("aria-label")).toBe("Hotel Roma, 4 stars, from $135.00");
    expect(container.textContent).toContain("4 out of 5 stars");

    const sourceBadge = container.querySelector('[aria-label="From Source A"]');
    expect(sourceBadge).not.toBeNull();

    const links = [...container.querySelectorAll("a")].map((anchor) => ({
      href: anchor.getAttribute("href"),
      text: anchor.textContent,
      ariaLabel: anchor.getAttribute("aria-label"),
    }));

    expect(links).toEqual([
        {
          href: "/search/tbo/TB-001?checkIn=2026-08-01&checkOut=2026-08-05&adults=2&rooms=1&sourceLabel=Source+A&childAge=7",
          text: "View Rooms",
          ariaLabel: "View rooms at Hotel Roma",
        },
        {
          href: "/booking/tbo/TB-001/rate-1?checkIn=2026-08-01&checkOut=2026-08-05&adults=2&rooms=1&sourceLabel=Source+A&childAge=7",
          text: "Book",
          ariaLabel: "Book Hotel Roma",
        },
      ]);
  });

  it("renders a remote image when the url is allowlisted", async () => {
    await act(async () => {
      root.render(<HotelResultCard hotel={BASE_HOTEL} searchInput={SEARCH_INPUT} sourceLabels={SOURCE_LABELS} />);
    });

    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("https://example.com/hotel.jpg");
    expect(image?.getAttribute("alt")).toBe("Hotel Roma primary image");
  });

  it("falls back to a stable placeholder when the image url is unusable", async () => {
    await act(async () => {
      root.render(
        <HotelResultCard
          hotel={{
            ...BASE_HOTEL,
            images: ["http://unsupported.example.org/hotel.jpg"],
            lowestRate: {
              ...BASE_HOTEL.lowestRate,
              cancellationPolicy: {
                ...BASE_HOTEL.lowestRate.cancellationPolicy,
                isRefundable: false,
                freeCancellationUntil: null,
              },
            },
          }}
          searchInput={SEARCH_INPUT}
          sourceLabels={SOURCE_LABELS}
        />,
      );
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("No image available");
    expect(container.textContent).toContain("Non-refundable");
  });
});
