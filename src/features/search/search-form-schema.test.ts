import { describe, expect, it } from "vitest";

import {
  createDefaultSearchFormValues,
  getFirstInvalidField,
  parseIsoDate,
  updateChildrenCount,
  validateSearchField,
  validateSearchForm,
} from "~/features/search/search-form-schema";

describe("search-form-schema", () => {
  it("defaults to 1 room contract with 2 adults and no children", () => {
    const defaults = createDefaultSearchFormValues(new Date("2026-03-01T12:00:00.000Z"));

    expect(defaults.adults).toBe(2);
    expect(defaults.children).toBe(0);
    expect(defaults.childrenAges).toEqual([]);
  });

  it("supports dynamic child age fields based on children count", () => {
    const defaults = createDefaultSearchFormValues(new Date("2026-03-01T12:00:00.000Z"));

    const withChildren = updateChildrenCount(defaults, 2);
    expect(withChildren.childrenAges).toEqual(["", ""]);

    const reduced = updateChildrenCount(withChildren, 1);
    expect(reduced.childrenAges).toEqual([""]);
  });

  it("validates future dates and checkout ordering", () => {
    const result = validateSearchForm({
      destination: "Rome",
      checkIn: "2001-01-01",
      checkOut: "2001-01-01",
      adults: 2,
      children: 0,
      childrenAges: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(result.errors.checkIn).toBeTruthy();
    expect(result.errors.checkOut).toBeTruthy();
  });

  it("returns field-level error details for blur validation", () => {
    const message = validateSearchField(
      {
        destination: "",
        checkIn: "2099-01-10",
        checkOut: "2099-01-12",
        adults: 2,
        children: 0,
        childrenAges: [],
      },
      "destination",
    );

    expect(message).toBe("Destination is required");
  });

  it("validates child ages and returns first invalid field for focus", () => {
    const values = {
      destination: "Rome",
      checkIn: "2099-01-10",
      checkOut: "2099-01-12",
      adults: 2,
      children: 2,
      childrenAges: ["6", ""],
    };

    const result = validateSearchForm(values);
    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const firstInvalid = getFirstInvalidField(result.errors, values);
    expect(firstInvalid).toBe("childrenAges.1");
  });

  it("maps valid form values to supplier search payload", () => {
    const result = validateSearchForm({
      destination: "  Rome  ",
      checkIn: "2099-01-10",
      checkOut: "2099-01-12",
      adults: 2,
      children: 1,
      childrenAges: ["7"],
    });

    expect(result).toEqual({
      success: true,
      data: {
        destination: "Rome",
        checkIn: "2099-01-10",
        checkOut: "2099-01-12",
        rooms: 1,
        adults: 2,
        childrenAges: [7],
      },
    });
  });

  it("rejects impossible calendar dates", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
  });
});
