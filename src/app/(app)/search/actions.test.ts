import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchHotelsAction } from "~/app/(app)/search/actions";
import { searchHotels } from "~/features/search/search-service";
import { auth } from "~/lib/auth";
import { ErrorCodes } from "~/lib/errors";

vi.mock("~/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("~/features/search/search-service", () => ({
  searchHotels: vi.fn(),
}));

const mockAuth = auth as unknown as Mock;
const mockSearchHotels = searchHotels as unknown as Mock;

const VALID_INPUT = {
  destination: "Rome",
  checkIn: "2026-08-01",
  checkOut: "2026-08-05",
  rooms: 1,
  adults: 2,
  childrenAges: [7],
};

describe("searchHotelsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication before validation or execution", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await searchHotelsAction({
      ...VALID_INPUT,
      checkOut: "2026-07-31",
    });

    expect(searchHotels).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.NOT_AUTHENTICATED,
        message: "Authentication required",
      },
    });
  });

  it("validates input before calling the service", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "agent-1", role: "AGENT" },
    });

    const result = await searchHotelsAction({
      ...VALID_INPUT,
      checkOut: "2026-08-01",
    });

    expect(searchHotels).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: "Check-out must be after check-in",
      },
    });
  });

  it("calls the search service with validated input when authenticated", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "agent-1", role: "AGENT" },
    });
    mockSearchHotels.mockResolvedValue({
      results: [],
      supplierStatus: { tbo: "success", expedia: "success" },
    });

    const result = await searchHotelsAction(VALID_INPUT);

    expect(searchHotels).toHaveBeenCalledWith(VALID_INPUT);
    expect(result).toEqual({
      success: true,
      data: {
        results: [],
        supplierStatus: { tbo: "success", expedia: "success" },
      },
    });
  });
});
