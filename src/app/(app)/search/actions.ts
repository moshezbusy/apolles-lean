"use server";

import { z } from "zod";

import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import { supplierIdSchema, type SupplierId } from "~/features/suppliers/contracts/supplier-schemas";
import { searchHotels, type SearchServiceResult } from "~/features/search/search-service";
import { getValidatedSession } from "~/lib/auth";
import { runProtectedAction, type ActionResult } from "~/lib/authorize";

const searchInputSchema: z.ZodType<SupplierSearchInput> = z
  .object({
    destination: z.string().trim().min(1, "Destination is required"),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    rooms: z.number().int().min(1).max(1),
    adults: z.number().int().min(1).max(6),
    childrenAges: z.array(z.number().int().min(0).max(17)),
  })
  .superRefine((value, ctx) => {
    if (value.checkOut <= value.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOut"],
        message: "Check-out must be after check-in",
      });
    }
  });

type SearchActionPayload = {
  input: SupplierSearchInput;
  options?: { suppliers?: SupplierId[] };
};

export async function searchHotelsAction(
  input: SupplierSearchInput,
  options?: { suppliers?: SupplierId[] },
): Promise<ActionResult<SearchServiceResult>> {
  const session = await getValidatedSession();
  const requestSchema: z.ZodType<SearchActionPayload> = z.object({
    input: searchInputSchema,
    options: z
      .object({
        suppliers: z.array(supplierIdSchema).min(1).optional(),
      })
      .optional(),
  });

  return runProtectedAction<SearchActionPayload, SearchServiceResult>({
    session,
    input: { input, options },
    validate: (payload) => requestSchema.parse(payload),
    execute: async ({ input: validatedInput }) =>
      searchHotels(validatedInput.input, validatedInput.options),
  });
}
