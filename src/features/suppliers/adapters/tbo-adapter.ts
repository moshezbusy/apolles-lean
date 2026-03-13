import type { Prisma } from "@prisma/client";
import type {
  SupplierAdapter,
  SupplierBookInput,
  SupplierPriceCheckInput,
  SupplierRoomDetailsInput,
  SupplierSearchInput,
} from "~/features/suppliers/contracts/supplier-adapter";
import {
  supplierSearchResultSchema,
  type SupplierSearchResult,
} from "~/features/suppliers/contracts/supplier-schemas";
import { withSupplierApiLogging } from "~/features/suppliers/supplier-logger";
import { AppError, ErrorCodes } from "~/lib/errors";

type TboSearchResponse = {
  Status?: {
    Code?: number;
    Description?: string;
  };
  Hotels?: unknown[];
};

type TboHotel = {
  HotelCode?: string;
  HotelName?: string;
  StarRating?: number;
  Address?: string;
  Images?: unknown;
  Rooms?: unknown;
};

type TboRoom = {
  RoomName?: string;
  MealPlan?: string;
  TotalFare?: number;
  Currency?: string;
  IsRefundable?: boolean;
  CancellationPolicy?: {
    IsRefundable?: boolean;
    Description?: string;
    FreeCancellationUntil?: string | null;
  };
};

export const TBO_TIMEOUT_MS = 5_000;
export const TBO_SEARCH_ENDPOINT =
  "https://api.tbotechnology.in/TBOHolidays_HotelAPI/HotelSearch";

async function getTboCredentials(): Promise<{ apiKey: string; apiSecret: string }> {
  const apiKey = process.env.TBO_API_KEY?.trim();
  const apiSecret = process.env.TBO_API_SECRET?.trim();

  if (apiKey && apiSecret) {
    return { apiKey, apiSecret };
  }

  try {
    const { env } = await import("~/env");
    const validatedApiKey = env.TBO_API_KEY.trim();
    const validatedApiSecret = env.TBO_API_SECRET.trim();

    if (validatedApiKey && validatedApiSecret) {
      return {
        apiKey: validatedApiKey,
        apiSecret: validatedApiSecret,
      };
    }
  } catch {
    // Fall through to typed AppError below.
  }

  throw new AppError(
    ErrorCodes.SUPPLIER_ERROR,
    "TBO API credentials are not configured",
  );
}

function buildSearchRequestBody(input: SupplierSearchInput) {
  return {
    destination: input.destination,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms,
    adults: input.adults,
    children: input.childrenAges.length,
    childrenAges: input.childrenAges,
  };
}

function toBasicAuth(apiKey: string, apiSecret: string): string {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const response = payload as Record<string, unknown>;
    const status = response.Status;

    if (status && typeof status === "object") {
      const description = (status as Record<string, unknown>).Description;

      if (typeof description === "string" && description.length > 0) {
        return description;
      }
    }
  }

  return "TBO supplier request failed";
}

function isRateUnavailableError(payload: unknown): boolean {
  const message = extractErrorMessage(payload).toLowerCase();

  return message.includes("rate unavailable") || message.includes("no availability");
}

function translateHttpFailure(status: number, payload: unknown): AppError {
  if (status === 401 || status === 403) {
    return new AppError(ErrorCodes.SUPPLIER_ERROR, "TBO authentication failed");
  }

  if (isRateUnavailableError(payload)) {
    return new AppError(ErrorCodes.RATE_UNAVAILABLE, "Requested rate is unavailable");
  }

  return new AppError(ErrorCodes.SUPPLIER_ERROR, extractErrorMessage(payload));
}

function pickLowestRate(hotel: TboHotel): TboRoom | null {
  if (!Array.isArray(hotel.Rooms) || hotel.Rooms.length === 0) {
    return null;
  }

  const validRooms = hotel.Rooms.filter(
    (room): room is TboRoom =>
      typeof room === "object" && room !== null && typeof (room as TboRoom).TotalFare === "number",
  );

  if (validRooms.length === 0) {
    return null;
  }

  return validRooms.reduce((lowest, current) =>
    (current.TotalFare ?? Number.POSITIVE_INFINITY) <
    (lowest.TotalFare ?? Number.POSITIVE_INFINITY)
      ? current
      : lowest,
  );
}

function deriveIsCancellable(isRefundable: boolean): boolean {
  return isRefundable;
}

function normalizeSearchResponse(payload: unknown): SupplierSearchResult[] {
  const response = payload as TboSearchResponse;

  if (!Array.isArray(response?.Hotels)) {
    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "Malformed TBO response payload");
  }

  const normalized: SupplierSearchResult[] = [];

  for (const hotelEntry of response.Hotels) {
    const hotel = hotelEntry as TboHotel;
    const lowestRate = pickLowestRate(hotel);

    if (!lowestRate) {
      continue;
    }

    const cancellationPolicy = lowestRate.CancellationPolicy;
    const isRefundable =
      typeof cancellationPolicy?.IsRefundable === "boolean"
        ? cancellationPolicy.IsRefundable
        : Boolean(lowestRate.IsRefundable);

    const cancellationDescription =
      typeof cancellationPolicy?.Description === "string" &&
      cancellationPolicy.Description.length > 0
        ? cancellationPolicy.Description
        : isRefundable
          ? "Refundable"
          : "Non-refundable";

    const candidate = {
      supplier: "tbo" as const,
      supplierHotelId: hotel.HotelCode,
      hotelName: hotel.HotelName,
      starRating: hotel.StarRating,
      address: hotel.Address,
      images: Array.isArray(hotel.Images)
        ? hotel.Images.filter((image): image is string => typeof image === "string")
        : [],
      lowestRate: {
        supplierAmount: lowestRate.TotalFare,
        currency: lowestRate.Currency,
        roomName: lowestRate.RoomName,
        mealPlan: lowestRate.MealPlan,
        cancellationPolicy: {
          isRefundable,
          freeCancellationUntil:
            typeof cancellationPolicy?.FreeCancellationUntil === "string"
              ? cancellationPolicy.FreeCancellationUntil
              : null,
          description: cancellationDescription,
        },
        isCancellable: deriveIsCancellable(isRefundable),
      },
    };

    const parsed = supplierSearchResultSchema.safeParse(candidate);

    if (parsed.success) {
      normalized.push(parsed.data);
    }
  }

  return normalized;
}

async function fetchTboSearch(
  requestBody: ReturnType<typeof buildSearchRequestBody>,
): Promise<{ status: number; payload: unknown }> {
  const { apiKey, apiSecret } = await getTboCredentials();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TBO_TIMEOUT_MS);

  try {
    const response = await fetch(TBO_SEARCH_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: toBasicAuth(apiKey, apiSecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      throw translateHttpFailure(response.status, payload);
    }

    return {
      status: response.status,
      payload,
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw new AppError(
        ErrorCodes.SUPPLIER_TIMEOUT,
        "TBO supplier request timed out after 5 seconds",
      );
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "TBO supplier request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function search(input: SupplierSearchInput): Promise<SupplierSearchResult[]> {
  const requestBody = buildSearchRequestBody(input);

  return withSupplierApiLogging({
    supplier: "tbo",
    method: "search",
    endpoint: TBO_SEARCH_ENDPOINT,
    requestBody,
    execute: async () => {
      const response = await fetchTboSearch(requestBody);
      const normalized = normalizeSearchResponse(response.payload);

      return {
        data: normalized,
        responseBody:
          response.payload as Prisma.SupplierApiLogCreateInput["responseBody"],
        responseStatus: response.status,
      };
    },
  });
}

function unsupportedMethod(methodName: string): never {
  throw new AppError(
    ErrorCodes.SUPPLIER_ERROR,
    `TBO adapter method '${methodName}' is not implemented in Story 2.2`,
  );
}

export const tboAdapter: SupplierAdapter = {
  supplier: "tbo",
  search,
  getRoomDetails(_input: SupplierRoomDetailsInput) {
    unsupportedMethod("getRoomDetails");
  },
  recheckPrice(_input: SupplierPriceCheckInput) {
    unsupportedMethod("recheckPrice");
  },
  book(_input: SupplierBookInput) {
    unsupportedMethod("book");
  },
};
