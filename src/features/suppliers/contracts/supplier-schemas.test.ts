import { describe, expect, it } from "vitest";

import {
  bookingResultSchema,
  priceCheckResultSchema,
  supplierRoomDetailSchema,
  supplierSearchResultSchema,
} from "~/features/suppliers/contracts/supplier-schemas";

describe("supplier normalized schemas", () => {
  it("accepts valid supplier search results", () => {
    const result = supplierSearchResultSchema.safeParse({
      supplier: "tbo",
      supplierHotelId: "hotel-123",
      hotelName: "Sample Hotel",
      starRating: 4,
      images: ["https://example.com/hotel.jpg"],
      lowestRate: {
        supplierAmount: 120.5,
        currency: "USD",
        roomName: "Deluxe Room",
        mealPlan: "Breakfast Included",
        cancellationPolicy: {
          isRefundable: true,
          freeCancellationUntil: "2026-03-20T12:00:00.000Z",
          description: "Free cancellation until March 20",
        },
        isCancellable: true,
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts supplier search result with Expedia metadata", () => {
    const result = supplierSearchResultSchema.safeParse({
      supplier: "expedia",
      supplierHotelId: "exp-123",
      hotelName: "Sample Expedia Hotel",
      starRating: 4,
      images: ["https://example.com/hotel.jpg"],
      lowestRate: {
        supplierAmount: 220,
        currency: "USD",
        roomName: "Deluxe Room",
        mealPlan: "Breakfast Included",
        cancellationPolicy: {
          isRefundable: true,
          description: "Free cancellation",
        },
        isCancellable: true,
      },
      supplierMetadata: {
        expedia: {
          taxDisclaimerText: "Expedia tax disclaimer",
          cancellationPolicyText: "Free cancellation",
          checkInInstructions: "Front desk open 24/7",
          paymentProcessingCountry: "US",
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects search result without supplierHotelId", () => {
    const result = supplierSearchResultSchema.safeParse({
      supplier: "expedia",
      supplierHotelId: "",
      hotelName: "Sample Hotel",
      starRating: 4,
      images: [],
      lowestRate: {
        supplierAmount: 120.5,
        currency: "USD",
        roomName: "Deluxe Room",
        mealPlan: "Breakfast Included",
        cancellationPolicy: {
          isRefundable: true,
          description: "Free cancellation until March 20",
        },
        isCancellable: true,
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid supplier room detail", () => {
    const result = supplierRoomDetailSchema.safeParse({
      supplier: "tbo",
      supplierHotelId: "hotel-123",
      hotelName: "Sample Hotel",
      rates: [
        {
          rateId: "rate-1",
          roomName: "Deluxe Room",
          mealPlan: "Room Only",
          cancellationPolicy: {
            isRefundable: false,
            description: "Non-refundable",
          },
          isCancellable: false,
          totalAmount: 350,
          currency: "USD",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid price check result", () => {
    const result = priceCheckResultSchema.safeParse({
      supplier: "expedia",
      supplierHotelId: "hotel-123",
      rateId: "rate-1",
      available: true,
      priceChanged: true,
      originalAmount: 120,
      currentAmount: 130,
      currency: "USD",
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative price check amount", () => {
    const result = priceCheckResultSchema.safeParse({
      supplier: "expedia",
      supplierHotelId: "hotel-123",
      rateId: "rate-1",
      available: true,
      priceChanged: true,
      originalAmount: -1,
      currentAmount: 130,
      currency: "USD",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid booking result", () => {
    const result = bookingResultSchema.safeParse({
      supplier: "tbo",
      supplierHotelId: "hotel-123",
      status: "confirmed",
      supplierBookingReference: "SUP-456",
      bookingId: "AP-123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects booking result with invalid status", () => {
    const result = bookingResultSchema.safeParse({
      supplier: "tbo",
      supplierHotelId: "hotel-123",
      status: "cancelled",
    });

    expect(result.success).toBe(false);
  });

  it("rejects room detail without rates", () => {
    const result = supplierRoomDetailSchema.safeParse({
      supplier: "tbo",
      supplierHotelId: "hotel-123",
      hotelName: "Sample Hotel",
    });

    expect(result.success).toBe(false);
  });

  it("rejects payloads with unsupported supplier id", () => {
    const result = bookingResultSchema.safeParse({
      supplier: "hilton",
      supplierHotelId: "hotel-123",
      status: "confirmed",
    });

    expect(result.success).toBe(false);
  });
});
