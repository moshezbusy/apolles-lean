import { z } from "zod";

import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";

export type SearchFormValues = {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: string[];
};

export type SearchFormErrors = Record<string, string>;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const FORM_FIELD_ORDER = ["destination", "checkIn", "checkOut", "adults", "children"] as const;

const INPUT_SCHEMA = z
  .object({
    destination: z.string().trim().min(1, "Destination is required"),
    checkIn: z.string().regex(DATE_ONLY_PATTERN, "Check-in date is required"),
    checkOut: z.string().regex(DATE_ONLY_PATTERN, "Check-out date is required"),
    adults: z.number().int().min(1, "Adults must be at least 1").max(6, "Adults must be 6 or fewer"),
    children: z.number().int().min(0, "Children cannot be negative"),
    childrenAges: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    const checkInDate = parseIsoDate(value.checkIn);
    const checkOutDate = parseIsoDate(value.checkOut);

    if (!checkInDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkIn"],
        message: "Check-in date is required",
      });
      return;
    }

    if (!checkOutDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOut"],
        message: "Check-out date is required",
      });
      return;
    }

    const today = startOfLocalDay(new Date());

    if (checkInDate <= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkIn"],
        message: "Check-in must be in the future",
      });
    }

    if (checkOutDate <= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOut"],
        message: "Check-out must be in the future",
      });
    }

    if (checkOutDate <= checkInDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOut"],
        message: "Check-out must be after check-in",
      });
    }

    if (value.childrenAges.length !== value.children) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["children"],
        message: "Children count must match age fields",
      });
    }

    value.childrenAges.forEach((age, index) => {
      if (age.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childrenAges", index],
          message: "Child age is required",
        });
        return;
      }

      const parsedAge = Number(age);
      if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 17) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childrenAges", index],
          message: "Child age must be between 0 and 17",
        });
      }
    });
  });

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (Number.isNaN(parsedDate.getTime()) || toIsoDate(parsedDate) !== value) {
    return null;
  }

  return parsedDate;
}

export function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

export function createDefaultSearchFormValues(referenceDate = new Date()): SearchFormValues {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(referenceDate);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return {
    destination: "",
    checkIn: toIsoDate(tomorrow),
    checkOut: toIsoDate(dayAfterTomorrow),
    adults: 2,
    children: 0,
    childrenAges: [],
  };
}

export function updateChildrenCount(values: SearchFormValues, nextChildrenCount: number): SearchFormValues {
  const count = Math.max(0, Math.floor(nextChildrenCount));
  const nextChildrenAges = values.childrenAges.slice(0, count);

  while (nextChildrenAges.length < count) {
    nextChildrenAges.push("");
  }

  return {
    ...values,
    children: count,
    childrenAges: nextChildrenAges,
  };
}

function issuePathToField(path: Array<string | number>): string {
  if (path.length === 0) {
    return "form";
  }

  if (path[0] === "childrenAges" && typeof path[1] === "number") {
    return `childrenAges.${path[1]}`;
  }

  return String(path[0]);
}

function collectErrors(result: z.SafeParseError<SearchFormValues>): SearchFormErrors {
  const errors: SearchFormErrors = {};

  for (const issue of result.error.issues) {
    const field = issuePathToField(issue.path);
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

export function validateSearchForm(values: SearchFormValues):
  | { success: true; data: SupplierSearchInput }
  | { success: false; errors: SearchFormErrors } {
  const result = INPUT_SCHEMA.safeParse(values);

  if (!result.success) {
    return {
      success: false,
      errors: collectErrors(result),
    };
  }

  return {
    success: true,
    data: {
      destination: result.data.destination.trim(),
      checkIn: result.data.checkIn,
      checkOut: result.data.checkOut,
      rooms: 1,
      adults: result.data.adults,
      childrenAges: result.data.childrenAges.map((age) => Number(age)),
    },
  };
}

export function validateSearchField(values: SearchFormValues, fieldName: string): string | undefined {
  const result = validateSearchForm(values);

  if (result.success) {
    return undefined;
  }

  return result.errors[fieldName];
}

export function getFieldErrorId(fieldName: string): string {
  return `search-${fieldName.replace(/\./g, "-")}-error`;
}

export function getFieldDescribedBy(fieldName: string, hasError: boolean): string | undefined {
  return hasError ? getFieldErrorId(fieldName) : undefined;
}

export function getFirstInvalidField(errors: SearchFormErrors, values: SearchFormValues): string | null {
  for (const field of FORM_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }

  for (let index = 0; index < values.children; index += 1) {
    const ageField = `childrenAges.${index}`;
    if (errors[ageField]) {
      return ageField;
    }
  }

  return null;
}
