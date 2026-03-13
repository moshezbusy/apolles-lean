import { z } from "zod";

export const supplierIdSchema = z.enum(["tbo", "expedia"]);

export const cancellationPolicySchema = z.object({
  isRefundable: z.boolean(),
  freeCancellationUntil: z.string().datetime().nullable().optional(),
  description: z.string(),
});

export const lowestRateSchema = z.object({
  supplierAmount: z.number().finite().nonnegative(),
  currency: z.string().min(3).max(3),
  roomName: z.string().min(1),
  mealPlan: z.string().min(1),
  cancellationPolicy: cancellationPolicySchema,
  isCancellable: z.boolean(),
});

export const supplierSearchResultSchema = z.object({
  supplier: supplierIdSchema,
  supplierHotelId: z.string().min(1),
  hotelName: z.string().min(1),
  starRating: z.number().min(0).max(5),
  address: z.string().min(1).optional(),
  images: z.array(z.string().url()).default([]),
  lowestRate: lowestRateSchema,
  supplierMetadata: z
    .object({
      expedia: z
        .object({
          taxDisclaimerText: z.string().min(1).optional(),
          cancellationPolicyText: z.string().min(1).optional(),
          checkInInstructions: z.string().min(1).optional(),
          paymentProcessingCountry: z.string().min(1).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const supplierRoomRateSchema = z.object({
  rateId: z.string().min(1),
  roomName: z.string().min(1),
  mealPlan: z.string().min(1),
  bedType: z.string().min(1).optional(),
  cancellationPolicy: cancellationPolicySchema,
  isCancellable: z.boolean(),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().min(3).max(3),
  taxesAndFees: z.number().finite().nonnegative().optional(),
});

export const supplierRoomDetailSchema = z.object({
  supplier: supplierIdSchema,
  supplierHotelId: z.string().min(1),
  hotelName: z.string().min(1),
  rates: z.array(supplierRoomRateSchema),
});

export const priceCheckResultSchema = z.object({
  supplier: supplierIdSchema,
  supplierHotelId: z.string().min(1),
  rateId: z.string().min(1),
  available: z.boolean(),
  priceChanged: z.boolean(),
  originalAmount: z.number().finite().nonnegative(),
  currentAmount: z.number().finite().nonnegative(),
  currency: z.string().min(3).max(3),
});

export const bookingResultSchema = z.object({
  supplier: supplierIdSchema,
  supplierHotelId: z.string().min(1),
  status: z.enum(["pending", "confirmed", "failed"]),
  supplierBookingReference: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
});

export type SupplierId = z.infer<typeof supplierIdSchema>;
export type SupplierSearchResult = z.infer<typeof supplierSearchResultSchema>;
export type SupplierRoomRate = z.infer<typeof supplierRoomRateSchema>;
export type SupplierRoomDetail = z.infer<typeof supplierRoomDetailSchema>;
export type PriceCheckResult = z.infer<typeof priceCheckResultSchema>;
export type BookingResult = z.infer<typeof bookingResultSchema>;
