/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { searchHotelsActionMock } = vi.hoisted(() => ({
  searchHotelsActionMock: vi.fn(),
}));

vi.mock("~/app/(app)/search/actions", () => ({
  searchHotelsAction: searchHotelsActionMock,
}));

import { SearchForm } from "~/features/search/search-form";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

describe("SearchForm", () => {
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    searchHotelsActionMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00.000Z"));
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;

    scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<SearchForm />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });

    container.remove();
    vi.useRealTimers();
  });

  function getInput(id: string): HTMLInputElement {
    const element = container.querySelector<HTMLInputElement>(`[id="${id}"]`);
    if (!element) {
      throw new Error(`Missing input: ${id}`);
    }

    return element;
  }

  function getForm(): HTMLFormElement {
    const element = container.querySelector("form");
    if (!element) {
      throw new Error("Missing form");
    }

    return element;
  }

  async function setInputValue(id: string, value: string) {
    const input = getInput(id);
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");

    await act(async () => {
      descriptor?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  async function blurInput(id: string) {
    const input = getInput(id);

    await act(async () => {
      input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
  }

  async function submitForm() {
    const form = getForm();

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }

  it("renders dynamic child age fields and shows blur validation", async () => {
    await setInputValue("children", "2");

    expect(container.querySelector('[id="childrenAges.0"]')).not.toBeNull();
    expect(container.querySelector('[id="childrenAges.1"]')).not.toBeNull();

    await blurInput("destination");

    expect(container.textContent).toContain("Destination is required");
  });

  it("focuses and scrolls to the first invalid field on submit", async () => {
    await submitForm();

    expect(document.activeElement).toBe(getInput("destination"));
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it("shows loading skeletons and then renders real results", async () => {
    const result = {
      success: true as const,
      data: {
        results: [
          {
            supplier: "tbo" as const,
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
        supplierStatus: {
          tbo: "success" as const,
          expedia: "success" as const,
        },
      },
    };
    const deferred = createDeferred<typeof result>();

    searchHotelsActionMock.mockReturnValue(deferred.promise);

    await setInputValue("destination", "Rome");
    await submitForm();

    expect(searchHotelsActionMock).toHaveBeenCalledWith(
      {
        destination: "Rome",
        checkIn: "2026-03-15",
        checkOut: "2026-03-16",
        rooms: 1,
        adults: 2,
        childrenAges: [],
      },
      undefined,
    );
    expect(container.textContent).toContain("Searching...");
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(6);

    await act(async () => {
      deferred.resolve(result);
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Hotel Roma");
    expect(container.textContent).toMatch(/Source [AB]/);
  });

  it("renders returned results with neutral source labels", async () => {
    searchHotelsActionMock.mockResolvedValue({
      success: true,
      data: {
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
        supplierStatus: {
          tbo: "success",
          expedia: "success",
        },
      },
    });

    await setInputValue("destination", "Rome");
    await submitForm();

    expect(container.textContent).toContain("Hotel Roma");
    expect(container.textContent).toMatch(/Source [AB]/);
    expect(container.textContent).not.toContain("tbo");
  });

  it("focuses the search form from the empty-state action instead of replaying the query", async () => {
    searchHotelsActionMock
      .mockResolvedValueOnce({
        success: true,
        data: {
          results: [],
          supplierStatus: {
            tbo: "failed",
            expedia: "success",
          },
        },
      });

    await setInputValue("destination", "Rome");
    await submitForm();

    expect(container.textContent).toContain("No hotels found for these dates. Try different dates or destination.");
    expect(container.textContent).toMatch(/Source [AB] is temporarily unavailable/);

    const searchAgainButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Search Again"),
    );

    await act(async () => {
      searchAgainButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.activeElement).toBe(getInput("destination"));
    expect(searchHotelsActionMock).toHaveBeenCalledTimes(1);
  });

  it("retries only the failed supplier while keeping visible results", async () => {
    searchHotelsActionMock
      .mockResolvedValueOnce({
        success: true,
        data: {
          results: [
            {
              supplier: "expedia",
              supplierHotelId: "EXP-1",
              hotelName: "Expedia Hotel",
              starRating: 4,
              images: [],
              lowestRate: {
                rateId: "rate-exp-1",
                supplierAmount: 190,
                displayAmount: 190,
                currency: "USD",
                roomName: "Deluxe",
                mealPlan: "Breakfast",
                cancellationPolicy: {
                  isRefundable: true,
                  freeCancellationUntil: null,
                  description: "Refundable",
                },
                isCancellable: true,
              },
            },
          ],
          supplierStatus: {
            tbo: "failed",
            expedia: "success",
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          results: [
            {
              supplier: "tbo",
              supplierHotelId: "TB-1",
              hotelName: "TBO Hotel",
              starRating: 5,
              images: [],
              lowestRate: {
                rateId: "rate-tbo-1",
                supplierAmount: 210,
                displayAmount: 210,
                currency: "USD",
                roomName: "Suite",
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
            tbo: "success",
            expedia: "success",
          },
        },
      });

    await setInputValue("destination", "Rome");
    await submitForm();

    const retryButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Retry Source"),
    );

    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(searchHotelsActionMock).toHaveBeenNthCalledWith(
      2,
      {
        destination: "Rome",
        checkIn: "2026-03-15",
        checkOut: "2026-03-16",
        rooms: 1,
        adults: 2,
        childrenAges: [],
      },
      { suppliers: ["tbo"] },
    );
    expect(container.textContent).toContain("Expedia Hotel");
    expect(container.textContent).toContain("TBO Hotel");
  });

  it("renders an error state with retry all when both suppliers fail", async () => {
    searchHotelsActionMock.mockResolvedValue({
      success: true,
      data: {
        results: [],
        supplierStatus: {
          tbo: "failed",
          expedia: "failed",
        },
      },
    });

    await setInputValue("destination", "Rome");
    await submitForm();

    expect(container.textContent).toContain("Unable to load results. Please try again.");

    const retryAllButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Retry All"),
    );

    expect(retryAllButton).not.toBeNull();
  });

  it("renders the action error state when the server action fails", async () => {
    searchHotelsActionMock.mockResolvedValue({
      success: false,
      error: {
        code: "SUPPLIER_ERROR",
        message: "Supplier request failed",
      },
    });

    await setInputValue("destination", "Rome");
    await submitForm();

    expect(container.textContent).toContain("Supplier request failed");
  });
});
