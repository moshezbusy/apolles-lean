import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import type { SupplierSearchResult } from "~/features/suppliers/contracts/supplier-schemas";

const CURRENCY_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();

const CANCELLATION_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const cached = CURRENCY_FORMATTER_CACHE.get(currency);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  CURRENCY_FORMATTER_CACHE.set(currency, formatter);
  return formatter;
}

export function formatResultPrice(amount: number, currency: string): string {
  try {
    return getCurrencyFormatter(currency).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatCancellationBadge(
  cancellationPolicy: SupplierSearchResult["lowestRate"]["cancellationPolicy"],
): string {
  if (!cancellationPolicy.isRefundable) {
    return "Non-refundable";
  }

  if (!cancellationPolicy.freeCancellationUntil) {
    return "Free cancellation available";
  }

  const cancellationDate = new Date(cancellationPolicy.freeCancellationUntil);

  if (Number.isNaN(cancellationDate.getTime())) {
    return "Free cancellation available";
  }

  return `Free cancel until ${CANCELLATION_DATE_FORMATTER.format(cancellationDate)}`;
}

export function getDisplayPrice(hotel: SupplierSearchResult): number {
  return hotel.lowestRate.displayAmount ?? hotel.lowestRate.supplierAmount;
}

export function buildHotelAriaLabel(hotel: SupplierSearchResult): string {
  return `${hotel.hotelName}, ${hotel.starRating} stars, from ${formatResultPrice(
    getDisplayPrice(hotel),
    hotel.lowestRate.currency,
  )}`;
}

export function getVisibleStarCount(starRating: number): number {
  return Math.max(0, Math.min(5, Math.round(starRating)));
}

export function getPrimaryHotelImage(hotel: SupplierSearchResult): string | null {
  for (const imageUrl of hotel.images) {
    try {
      const parsedUrl = new URL(imageUrl);
      if (parsedUrl.protocol === "https:") {
        return imageUrl;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildSearchParams(searchInput: SupplierSearchInput, sourceLabel: string): string {
  const params = new URLSearchParams({
    checkIn: searchInput.checkIn,
    checkOut: searchInput.checkOut,
    adults: String(searchInput.adults),
    rooms: String(searchInput.rooms),
    sourceLabel,
  });

  for (const childAge of searchInput.childrenAges) {
    params.append("childAge", String(childAge));
  }

  return params.toString();
}

export function buildViewRoomsHref(
  hotel: SupplierSearchResult,
  searchInput: SupplierSearchInput,
  sourceLabel: string,
): string {
  return `/search/${encodeURIComponent(hotel.supplier)}/${encodeURIComponent(hotel.supplierHotelId)}?${buildSearchParams(searchInput, sourceLabel)}`;
}

export function buildBookHref(
  hotel: SupplierSearchResult,
  searchInput: SupplierSearchInput,
  sourceLabel: string,
): string {
  return `/booking/${encodeURIComponent(hotel.supplier)}/${encodeURIComponent(hotel.supplierHotelId)}/${encodeURIComponent(hotel.lowestRate.rateId)}?${buildSearchParams(searchInput, sourceLabel)}`;
}
