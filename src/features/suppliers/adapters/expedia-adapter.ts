import { createHash } from "node:crypto";

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

type ExpediaSearchResponse = {
  data?: unknown[];
  message?: string;
};

type ExpediaHotel = {
  property_id?: string;
  name?: string;
  star_rating?: number;
  address?: {
    line1?: string;
  };
  images?: unknown;
  rates?: unknown;
};

type ExpediaRate = {
  room_name?: string;
  board_type?: string;
  total_price?: {
    amount?: number;
    currency?: string;
  };
  refundable?: boolean;
  cancellation_policy?: {
    free_cancellation_until?: string | null;
    text?: string;
  };
  metadata?: {
    tax_disclaimer_text?: string;
    cancellation_policy_text?: string;
    check_in_instructions?: string;
    payment_processing_country?: string;
  };
};

export const EXPEDIA_TIMEOUT_MS = 5_000;
export const EXPEDIA_SEARCH_ENDPOINT =
  "https://api.expediagroup.com/rapid/v3/properties/search";

type ExpediaCredentials = {
  apiKey: string;
  apiSecret: string;
};

async function getExpediaCredentials(): Promise<ExpediaCredentials> {
  const apiKey = process.env.EXPEDIA_API_KEY?.trim();
  const apiSecret = process.env.EXPEDIA_API_SECRET?.trim();

  if (apiKey && apiSecret) {
    return { apiKey, apiSecret };
  }

  try {
    const { env } = await import("~/env");
    const validatedApiKey = env.EXPEDIA_API_KEY.trim();
    const validatedApiSecret = env.EXPEDIA_API_SECRET.trim();

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
    "Expedia API credentials are not configured",
  );
}

function buildExpediaSearchRequestBody(input: SupplierSearchInput) {
  return {
    destination: input.destination,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms,
    adults: input.adults,
    childrenAges: input.childrenAges,
    children: input.childrenAges.length,
  };
}

function buildExpediaSignatureHeaders(credentials: ExpediaCredentials) {
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const signature = createHash("sha512")
    .update(`${credentials.apiKey}${credentials.apiSecret}${timestamp}`)
    .digest("hex");

  return {
    "X-Expedia-Api-Key": credentials.apiKey,
    "X-Expedia-Timestamp": timestamp,
    "X-Expedia-Signature": signature,
  };
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

    if (typeof response.message === "string" && response.message.length > 0) {
      return response.message;
    }
  }

  return "Expedia supplier request failed";
}

function isRateUnavailableError(payload: unknown): boolean {
  const message = extractErrorMessage(payload).toLowerCase();

  return message.includes("rate unavailable") || message.includes("no availability");
}

function translateHttpFailure(status: number, payload: unknown): AppError {
  if (status === 401 || status === 403) {
    return new AppError(ErrorCodes.SUPPLIER_ERROR, "Expedia authentication failed");
  }

  if (isRateUnavailableError(payload)) {
    return new AppError(ErrorCodes.RATE_UNAVAILABLE, "Requested rate is unavailable");
  }

  return new AppError(ErrorCodes.SUPPLIER_ERROR, extractErrorMessage(payload));
}

function pickLowestRate(hotel: ExpediaHotel): ExpediaRate | null {
  if (!Array.isArray(hotel.rates) || hotel.rates.length === 0) {
    return null;
  }

  const validRates = hotel.rates.filter(
    (rate): rate is ExpediaRate =>
      typeof rate === "object" &&
      rate !== null &&
      typeof (rate as ExpediaRate).total_price?.amount === "number",
  );

  if (validRates.length === 0) {
    return null;
  }

  return validRates.reduce((lowest, current) =>
    (current.total_price?.amount ?? Number.POSITIVE_INFINITY) <
    (lowest.total_price?.amount ?? Number.POSITIVE_INFINITY)
      ? current
      : lowest,
  );
}

function extractImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => {
      if (typeof image !== "object" || image === null) {
        return undefined;
      }

      const url = (image as { url?: unknown }).url;
      return typeof url === "string" ? url : undefined;
    })
    .filter((url): url is string => typeof url === "string");
}

function normalizeSearchResponse(payload: unknown): SupplierSearchResult[] {
  const response = payload as ExpediaSearchResponse;

  if (!Array.isArray(response?.data)) {
    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "Malformed Expedia response payload");
  }

  const normalized: SupplierSearchResult[] = [];

  for (const hotelEntry of response.data) {
    const hotel = hotelEntry as ExpediaHotel;
    const lowestRate = pickLowestRate(hotel);

    if (!lowestRate) {
      continue;
    }

    const cancellationPolicy = lowestRate.cancellation_policy;
    const isRefundable = Boolean(lowestRate.refundable);

    const cancellationDescription =
      typeof cancellationPolicy?.text === "string" && cancellationPolicy.text.length > 0
        ? cancellationPolicy.text
        : isRefundable
          ? "Refundable"
          : "Non-refundable";

    const candidate = {
      supplier: "expedia" as const,
      supplierHotelId: hotel.property_id,
      hotelName: hotel.name,
      starRating: hotel.star_rating,
      address: hotel.address?.line1,
      images: extractImageUrls(hotel.images),
      lowestRate: {
        supplierAmount: lowestRate.total_price?.amount,
        currency: lowestRate.total_price?.currency,
        roomName: lowestRate.room_name,
        mealPlan: lowestRate.board_type,
        cancellationPolicy: {
          isRefundable,
          freeCancellationUntil:
            typeof cancellationPolicy?.free_cancellation_until === "string"
              ? cancellationPolicy.free_cancellation_until
              : null,
          description: cancellationDescription,
        },
        isCancellable: isRefundable,
      },
      supplierMetadata: {
        expedia: {
          taxDisclaimerText: lowestRate.metadata?.tax_disclaimer_text,
          cancellationPolicyText: lowestRate.metadata?.cancellation_policy_text,
          checkInInstructions: lowestRate.metadata?.check_in_instructions,
          paymentProcessingCountry: lowestRate.metadata?.payment_processing_country,
        },
      },
    };

    const parsed = supplierSearchResultSchema.safeParse(candidate);

    if (parsed.success) {
      normalized.push(parsed.data);
    }
  }

  return normalized;
}

async function fetchExpediaSearch(
  requestBody: ReturnType<typeof buildExpediaSearchRequestBody>,
): Promise<{ status: number; payload: unknown }> {
  const credentials = await getExpediaCredentials();
  const signatureHeaders = buildExpediaSignatureHeaders(credentials);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPEDIA_TIMEOUT_MS);

  try {
    const response = await fetch(EXPEDIA_SEARCH_ENDPOINT, {
      method: "POST",
      headers: {
        ...signatureHeaders,
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
        "Expedia supplier request timed out after 5 seconds",
      );
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "Expedia supplier request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function search(input: SupplierSearchInput): Promise<SupplierSearchResult[]> {
  const requestBody = buildExpediaSearchRequestBody(input);

  return withSupplierApiLogging({
    supplier: "expedia",
    method: "search",
    endpoint: EXPEDIA_SEARCH_ENDPOINT,
    requestBody,
    execute: async () => {
      const response = await fetchExpediaSearch(requestBody);
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
    `Expedia adapter method '${methodName}' is not implemented in Story 2.3`,
  );
}

export const expediaAdapter: SupplierAdapter = {
  supplier: "expedia",
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
