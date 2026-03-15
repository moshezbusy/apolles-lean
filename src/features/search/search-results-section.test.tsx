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

import { SearchResultsSection } from "~/features/search/search-results-section";
import { createSourceLabelMap } from "~/features/search/source-labels";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const SEARCH_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [],
};

const SOURCE_LABELS = createSourceLabelMap("tbo");

const SUCCESS_STATE = {
  status: "success" as const,
  results: [
    {
      supplier: "tbo" as const,
      supplierHotelId: "TB-001",
      hotelName: "Hotel Roma",
      starRating: 4,
      address: "Rome, Italy",
      images: [],
      lowestRate: {
        rateId: "rate-1",
        supplierAmount: 120,
        displayAmount: 130,
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
  ],
  supplierStatus: {
    tbo: "failed" as const,
    expedia: "success" as const,
  },
  errorMessage: null,
};

describe("SearchResultsSection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it("renders an amber supplier banner above visible results with a source-specific retry action", async () => {
    const onRetry = vi.fn();

    await act(async () => {
      root.render(
        <SearchResultsSection
          state={SUCCESS_STATE}
          searchInput={SEARCH_INPUT}
          sourceLabels={SOURCE_LABELS}
          onRetry={onRetry}
        />,
      );
    });

    expect(container.textContent).toContain("Supplier availability issue");
    expect(container.textContent).toContain("Source A is temporarily unavailable");
    expect(container.textContent).toContain("Hotel Roma");

    const retryButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Retry Source A"),
    );

    expect(retryButton).toBeTruthy();

    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith("tbo");
  });

  it("renders the story empty-state copy and search-again action", async () => {
    const onRetry = vi.fn();

    await act(async () => {
      root.render(
        <SearchResultsSection
          state={{
            status: "empty",
            results: [],
            supplierStatus: {
              tbo: "success",
              expedia: "success",
            },
            errorMessage: null,
          }}
          searchInput={SEARCH_INPUT}
          sourceLabels={SOURCE_LABELS}
          onRetry={onRetry}
          onSearchAgain={onRetry}
        />,
      );
    });

    expect(container.textContent).toContain("No hotels found for these dates. Try different dates or destination.");

    const button = [...container.querySelectorAll("button")].find((candidate) =>
      candidate.textContent?.includes("Search Again"),
    );

    expect(button).toBeTruthy();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a retry-all action when both suppliers fail", async () => {
    const onRetry = vi.fn();

    await act(async () => {
      root.render(
        <SearchResultsSection
          state={{
            status: "error",
            results: [],
            supplierStatus: {
              tbo: "failed",
              expedia: "failed",
            },
            errorMessage: "Unable to load results. Please try again.",
          }}
          searchInput={SEARCH_INPUT}
          sourceLabels={SOURCE_LABELS}
          onRetry={onRetry}
        />,
      );
    });

    const retryAllButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Retry All"),
    );

    expect(retryAllButton).toBeTruthy();

    await act(async () => {
      retryAllButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRetry).toHaveBeenCalledWith(null);
  });
});
