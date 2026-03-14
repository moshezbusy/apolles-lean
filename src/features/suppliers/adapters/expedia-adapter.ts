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
import {
  createLoggedSupplierError,
  isLoggedSupplierError,
  withSupplierApiLogging,
} from "~/features/suppliers/supplier-logger";
import { AppError, ErrorCodes, isAppError } from "~/lib/errors";

type ExpediaRegionResponse = {
  property_ids_expanded?: unknown;
  property_ids?: unknown;
};

type ExpediaContentResponse = Record<string, ExpediaContentProperty>;

type ExpediaContentProperty = {
  property_id?: string;
  name?: string;
  address?: {
    line_1?: string;
    city?: string;
    country_code?: string;
  };
  ratings?: {
    property?: {
      rating?: string;
    };
  };
  images?: unknown;
  checkin?: {
    instructions?: string;
    special_instructions?: string;
  };
};

type ExpediaAvailabilityResponse = ExpediaAvailabilityProperty[];

type ExpediaAvailabilityProperty = {
  property_id?: string;
  rooms?: unknown;
};

type ExpediaRoom = {
  room_name?: string;
  rates?: unknown;
};

type ExpediaRate = {
  refundable?: boolean;
  current_refundability?: string;
  merchant_of_record?: string;
  amenities?: Record<string, { name?: string }>;
  cancel_penalties?: Array<{
    start?: string;
    amount?: string;
  }>;
  occupancy_pricing?: Record<string, ExpediaOccupancyPricing>;
};

type ExpediaOccupancyPricing = {
  totals?: {
    inclusive?: {
      request_currency?: {
        value?: string;
        currency?: string;
      };
    };
    property_inclusive?: {
      request_currency?: {
        value?: string;
        currency?: string;
      };
    };
  };
};

type ExpediaCredentials = {
  apiKey: string;
  apiSecret: string;
};

type ExpediaDestinationTarget =
  | { kind: "property_ids"; propertyIds: string[] }
  | { kind: "region"; regionId: string };

type ExpediaResolvedProperty = {
  propertyId: string;
  hotelName?: string;
  starRating?: number;
  address?: string;
  images: string[];
  checkInInstructions?: string;
  paymentProcessingCountry?: string;
};

type ExpediaResolvedRate = {
  propertyId: string;
  roomName?: string;
  mealPlan?: string;
  amount?: number;
  currency?: string;
  isRefundable: boolean;
  cancellationDescription: string;
  freeCancellationUntil: string | null;
  cancellationPolicyText?: string;
};

export const EXPEDIA_TIMEOUT_MS = 5_000;
export const EXPEDIA_API_BASE_URL = "https://api.ean.com/v3";
export const EXPEDIA_AVAILABILITY_ENDPOINT =
  `${EXPEDIA_API_BASE_URL}/properties/availability`;
export const EXPEDIA_CONTENT_ENDPOINT = `${EXPEDIA_API_BASE_URL}/properties/content`;
export const EXPEDIA_REGION_ENDPOINT = `${EXPEDIA_API_BASE_URL}/regions`;
export const EXPEDIA_DEFAULT_LANGUAGE = "en-US";
export const EXPEDIA_DEFAULT_CURRENCY = "USD";
export const EXPEDIA_DEFAULT_COUNTRY_CODE = "US";
export const EXPEDIA_DEFAULT_RATE_PLAN_COUNT = "1";
export const EXPEDIA_DEFAULT_SALES_CHANNEL = "agent_tool";
export const EXPEDIA_DEFAULT_SALES_ENVIRONMENT = "hotel_only";
export const EXPEDIA_USER_AGENT = "Apolles/0.1.0";

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

function buildAuthorizationHeader(credentials: ExpediaCredentials): string {
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const signature = createHash("sha512")
    .update(`${credentials.apiKey}${credentials.apiSecret}${timestamp}`)
    .digest("hex");

  return `EAN APIKey=${credentials.apiKey},Signature=${signature},timestamp=${timestamp}`;
}

function buildRapidHeaders(credentials: ExpediaCredentials): HeadersInit {
  return {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    Authorization: buildAuthorizationHeader(credentials),
    "User-Agent": EXPEDIA_USER_AGENT,
  };
}

function parseDestinationTarget(destination: string): ExpediaDestinationTarget {
  const trimmedDestination = destination.trim();

  const propertyMatch = trimmedDestination.match(/^property:(.+)$/i);
  if (propertyMatch) {
    const propertyIds = propertyMatch[1]
      ?.split(",")
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value && /^\d+$/.test(value)));

    if (propertyIds && propertyIds.length > 0) {
      return { kind: "property_ids", propertyIds };
    }
  }

  const regionMatch = trimmedDestination.match(/^region:(\d+)$/i);
  if (regionMatch?.[1]) {
    return { kind: "region", regionId: regionMatch[1] };
  }

  throw new AppError(
    ErrorCodes.SUPPLIER_ERROR,
    "Expedia search currently requires a mapped destination in the form region:<id> or property:<id>",
  );
}

function buildOccupancyValue(input: SupplierSearchInput): string {
  const childSegment = input.childrenAges.length > 0 ? `-${input.childrenAges.join(",")}` : "";
  return `${input.adults}${childSegment}`;
}

function buildAvailabilityRequestQuery(
  propertyIds: string[],
  input: SupplierSearchInput,
): URLSearchParams {
  const params = new URLSearchParams({
    checkin: input.checkIn,
    checkout: input.checkOut,
    currency: EXPEDIA_DEFAULT_CURRENCY,
    country_code: EXPEDIA_DEFAULT_COUNTRY_CODE,
    language: EXPEDIA_DEFAULT_LANGUAGE,
    rate_plan_count: EXPEDIA_DEFAULT_RATE_PLAN_COUNT,
    sales_channel: EXPEDIA_DEFAULT_SALES_CHANNEL,
    sales_environment: EXPEDIA_DEFAULT_SALES_ENVIRONMENT,
  });

  const occupancyValue = buildOccupancyValue(input);
  for (let index = 0; index < input.rooms; index += 1) {
    params.append("occupancy", occupancyValue);
  }

  for (const propertyId of propertyIds.slice(0, 250)) {
    params.append("property_id", propertyId);
  }

  return params;
}

function buildContentRequestQuery(propertyIds: string[]): URLSearchParams {
  const params = new URLSearchParams({
    language: EXPEDIA_DEFAULT_LANGUAGE,
    supply_source: "expedia",
  });

  for (const include of ["name", "address", "images", "ratings", "checkin"]) {
    params.append("include", include);
  }

  for (const propertyId of propertyIds.slice(0, 250)) {
    params.append("property_id", propertyId);
  }

  return params;
}

function buildRegionRequestQuery(): URLSearchParams {
  const params = new URLSearchParams({
    language: EXPEDIA_DEFAULT_LANGUAGE,
    supply_source: "expedia",
  });
  params.append("include", "property_ids_expanded");
  return params;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function parseResponseJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message;
    }

    const errors = record.errors;
    if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
      const firstError = errors[0] as Record<string, unknown>;
      if (typeof firstError.message === "string" && firstError.message.length > 0) {
        return firstError.message;
      }
    }
  }

  return "Expedia supplier request failed";
}

function isRateUnavailableError(payload: unknown): boolean {
  const message = extractErrorMessage(payload).toLowerCase();
  return (
    message.includes("rate unavailable") ||
    message.includes("no availability") ||
    message.includes("sold out")
  );
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

function sanitizeHtmlText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAddress(content: ExpediaContentProperty | undefined): string | undefined {
  const segments = [content?.address?.line_1, content?.address?.city]
    .filter((segment): segment is string => Boolean(segment?.trim()))
    .map((segment) => segment.trim());

  return segments.length > 0 ? segments.join(", ") : undefined;
}

function extractImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  const urls: string[] = [];

  for (const image of images) {
    if (typeof image === "string") {
      urls.push(image);
      continue;
    }

    if (typeof image !== "object" || image === null) {
      continue;
    }

    const candidate = image as Record<string, unknown>;
    const directUrl = candidate.url;
    if (typeof directUrl === "string") {
      urls.push(directUrl);
      continue;
    }

    const links = candidate.links;
    if (links && typeof links === "object") {
      for (const linkValue of Object.values(links as Record<string, unknown>)) {
        if (typeof linkValue === "object" && linkValue !== null) {
          const href = (linkValue as Record<string, unknown>).href;
          if (typeof href === "string") {
            urls.push(href);
          }
        }
      }
    }
  }

  return urls;
}

function normalizePropertyContent(
  propertyIds: string[],
  payload: unknown,
): Map<string, ExpediaResolvedProperty> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "Malformed Expedia content payload");
  }

  const response = payload as ExpediaContentResponse;
  const properties = new Map<string, ExpediaResolvedProperty>();

  for (const propertyId of propertyIds) {
    const content = response[propertyId];
    properties.set(propertyId, {
      propertyId,
      hotelName: content?.name,
      starRating: content?.ratings?.property?.rating
        ? Number(content.ratings.property.rating)
        : undefined,
      address: buildAddress(content),
      images: extractImageUrls(content?.images),
      checkInInstructions:
        sanitizeHtmlText(content?.checkin?.instructions) ??
        sanitizeHtmlText(content?.checkin?.special_instructions),
      paymentProcessingCountry: content?.address?.country_code,
    });
  }

  return properties;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getMealPlan(rate: ExpediaRate): string | undefined {
  const amenityNames = Object.values(rate.amenities ?? {})
    .map((amenity) => amenity.name?.trim())
    .filter((name): name is string => Boolean(name));

  return amenityNames[0] ?? "See rate details";
}

function buildCancellationDescription(rate: ExpediaRate): {
  description: string;
  freeCancellationUntil: string | null;
} {
  const penalty = rate.cancel_penalties?.[0];

  if (rate.refundable && penalty?.start) {
    return {
      description: `Free cancellation until ${penalty.start}`,
      freeCancellationUntil: penalty.start,
    };
  }

  if (rate.current_refundability === "partially_refundable" && penalty?.start) {
    return {
      description: `Partial refund available until ${penalty.start}`,
      freeCancellationUntil: penalty.start,
    };
  }

  return {
    description: rate.refundable ? "Refundable" : "Non-refundable",
    freeCancellationUntil: null,
  };
}

function pickLowestRate(
  property: ExpediaAvailabilityProperty,
  occupancyKey: string,
): ExpediaResolvedRate | null {
  if (!Array.isArray(property.rooms) || property.rooms.length === 0) {
    return null;
  }

  let lowestRate: ExpediaResolvedRate | null = null;

  for (const roomEntry of property.rooms) {
    if (typeof roomEntry !== "object" || roomEntry === null) {
      continue;
    }

    const room = roomEntry as ExpediaRoom;
    if (!Array.isArray(room.rates)) {
      continue;
    }

    for (const rateEntry of room.rates) {
      if (typeof rateEntry !== "object" || rateEntry === null) {
        continue;
      }

      const rate = rateEntry as ExpediaRate;
      const occupancyPricing = rate.occupancy_pricing?.[occupancyKey];
      const pricing = occupancyPricing?.totals;
      const requestCurrencyPricing =
        pricing?.property_inclusive?.request_currency ?? pricing?.inclusive?.request_currency;
      const amount = toNumber(requestCurrencyPricing?.value);

      if (typeof amount !== "number") {
        continue;
      }

      const cancellation = buildCancellationDescription(rate);
      const candidate: ExpediaResolvedRate = {
        propertyId: property.property_id ?? "",
        roomName: room.room_name,
        mealPlan: getMealPlan(rate),
        amount,
        currency: requestCurrencyPricing?.currency,
        isRefundable: Boolean(rate.refundable),
        cancellationDescription: cancellation.description,
        freeCancellationUntil: cancellation.freeCancellationUntil,
        cancellationPolicyText: cancellation.description,
      };

      if (!lowestRate || (candidate.amount ?? Number.POSITIVE_INFINITY) < (lowestRate.amount ?? Number.POSITIVE_INFINITY)) {
        lowestRate = candidate;
      }
    }
  }

  return lowestRate;
}

function normalizeAvailabilityResponse(
  payload: unknown,
  propertyLookup: Map<string, ExpediaResolvedProperty>,
  occupancyKey: string,
): SupplierSearchResult[] {
  if (!Array.isArray(payload)) {
    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "Malformed Expedia availability payload");
  }

  const response = payload as ExpediaAvailabilityResponse;
  const normalized: SupplierSearchResult[] = [];

  for (const property of response) {
    if (!property?.property_id) {
      continue;
    }

    const content = propertyLookup.get(property.property_id);
    const lowestRate = pickLowestRate(property, occupancyKey);

    if (!lowestRate) {
      continue;
    }

    const candidate = {
      supplier: "expedia" as const,
      supplierHotelId: property.property_id,
      hotelName: content?.hotelName,
      starRating: content?.starRating,
      address: content?.address,
      images: content?.images ?? [],
      lowestRate: {
        supplierAmount: lowestRate.amount,
        currency: lowestRate.currency,
        roomName: lowestRate.roomName,
        mealPlan: lowestRate.mealPlan,
        cancellationPolicy: {
          isRefundable: lowestRate.isRefundable,
          freeCancellationUntil: lowestRate.freeCancellationUntil,
          description: lowestRate.cancellationDescription,
        },
        isCancellable: lowestRate.isRefundable,
      },
      supplierMetadata: {
        expedia: {
          cancellationPolicyText: lowestRate.cancellationPolicyText,
          checkInInstructions: content?.checkInInstructions,
          paymentProcessingCountry: content?.paymentProcessingCountry,
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

async function fetchRapidJson(url: string, credentials: ExpediaCredentials): Promise<{
  status: number;
  payload: unknown;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPEDIA_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: buildRapidHeaders(credentials),
      signal: controller.signal,
    });

    const payload = await parseResponseJson(response);

    if (!response.ok) {
      throw createLoggedSupplierError(translateHttpFailure(response.status, payload), {
        responseBody: payload as Prisma.SupplierApiLogCreateInput["responseBody"],
        responseStatus: response.status,
      });
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

    if (isLoggedSupplierError(error)) {
      throw error;
    }

    if (isAppError(error)) {
      throw error;
    }

    throw new AppError(ErrorCodes.SUPPLIER_ERROR, "Expedia supplier request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolvePropertyIds(
  destination: ExpediaDestinationTarget,
  credentials: ExpediaCredentials,
): Promise<string[]> {
  if (destination.kind === "property_ids") {
    return destination.propertyIds;
  }

  const regionUrl = `${EXPEDIA_REGION_ENDPOINT}/${destination.regionId}?${buildRegionRequestQuery().toString()}`;
  const response = await fetchRapidJson(regionUrl, credentials);

  const payload = response.payload as ExpediaRegionResponse;
  const propertyIds = Array.isArray(payload?.property_ids_expanded)
    ? payload.property_ids_expanded
    : Array.isArray(payload?.property_ids)
      ? payload.property_ids
      : [];

  const normalizedPropertyIds = propertyIds
    .filter((propertyId): propertyId is string => typeof propertyId === "string")
    .slice(0, 250);

  if (normalizedPropertyIds.length === 0) {
    return [];
  }

  return normalizedPropertyIds;
}

async function search(input: SupplierSearchInput): Promise<SupplierSearchResult[]> {
  const destination = parseDestinationTarget(input.destination);

  return withSupplierApiLogging({
    supplier: "expedia",
    method: "search",
    endpoint: EXPEDIA_AVAILABILITY_ENDPOINT,
    requestBody: {
      destination: input.destination,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      adults: input.adults,
      childrenAges: input.childrenAges,
      request: "Rapid availability + content lookup",
    },
    execute: async () => {
      const credentials = await getExpediaCredentials();
      const propertyIds = await resolvePropertyIds(destination, credentials);

      if (propertyIds.length === 0) {
        return {
          data: [],
          responseBody: [] as Prisma.SupplierApiLogCreateInput["responseBody"],
          responseStatus: 200,
        };
      }

      const contentUrl = `${EXPEDIA_CONTENT_ENDPOINT}?${buildContentRequestQuery(propertyIds).toString()}`;
      const availabilityQuery = buildAvailabilityRequestQuery(propertyIds, input);
      const availabilityUrl = `${EXPEDIA_AVAILABILITY_ENDPOINT}?${availabilityQuery.toString()}`;

      const [contentResponse, availabilityResponse] = await Promise.all([
        fetchRapidJson(contentUrl, credentials),
        fetchRapidJson(availabilityUrl, credentials),
      ]);

      const propertyLookup = normalizePropertyContent(propertyIds, contentResponse.payload);
      const normalized = normalizeAvailabilityResponse(
        availabilityResponse.payload,
        propertyLookup,
        buildOccupancyValue(input),
      );

      return {
        data: normalized,
        responseBody:
          availabilityResponse.payload as Prisma.SupplierApiLogCreateInput["responseBody"],
        responseStatus: availabilityResponse.status,
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
  cancel() {
    unsupportedMethod("cancel");
  },
  getBookingDetail() {
    unsupportedMethod("getBookingDetail");
  },
};
