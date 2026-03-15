"use client";

import { Loader2Icon, SearchIcon } from "lucide-react";
import React from "react";
import { type FormEvent, useMemo, useRef, useState, useTransition } from "react";

import { searchHotelsAction } from "~/app/(app)/search/actions";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  createDefaultSearchFormValues,
  getFieldDescribedBy,
  getFieldErrorId,
  getFirstInvalidField,
  parseIsoDate,
  toIsoDate,
  updateChildrenCount,
  validateSearchField,
  validateSearchForm,
  type SearchFormErrors,
  type SearchFormValues,
} from "~/features/search/search-form-schema";
import {
  beginSearch,
  INITIAL_SEARCH_UI_STATE,
  resolveSearchError,
  resolveSearchResult,
} from "~/features/search/search-form-state";
import { SearchResultsSection } from "~/features/search/search-results-section";
import { createSourceLabelMapFromSeed, type SourceLabelMap } from "~/features/search/source-labels";
import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import type { SupplierId } from "~/features/suppliers/contracts/supplier-schemas";

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function DateField({
  id,
  label,
  value,
  error,
  onChange,
  onBlur,
  setFieldRef,
}: {
  id: "checkIn" | "checkOut";
  label: string;
  value: string;
  error?: string;
  onChange: (nextValue: string) => void;
  onBlur: (nextValue?: string) => void;
  setFieldRef: (fieldName: string, element: HTMLElement | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseIsoDate(value) ?? undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={(element) => {
              setFieldRef(id, element);
            }}
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
            aria-invalid={error ? true : undefined}
            aria-describedby={getFieldDescribedBy(id, Boolean(error))}
          >
            {selectedDate ? DATE_LABEL_FORMATTER.format(selectedDate) : `Select ${label.toLowerCase()}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(nextDate) => {
              if (!nextDate) {
                return;
              }

              const nextValue = toIsoDate(nextDate);
              onChange(nextValue);
              onBlur(nextValue);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {error ? (
        <p id={getFieldErrorId(id)} className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SearchForm() {
  const [formValues, setFormValues] = useState<SearchFormValues>(() => createDefaultSearchFormValues());
  const [fieldErrors, setFieldErrors] = useState<SearchFormErrors>({});
  const [formState, setFormState] = useState(INITIAL_SEARCH_UI_STATE);
  const [lastSubmittedSearch, setLastSubmittedSearch] = useState<SupplierSearchInput | null>(null);
  const [sourceLabels, setSourceLabels] = useState<SourceLabelMap | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const childAgeFields = useMemo(
    () => Array.from({ length: formValues.children }, (_, index) => `childrenAges.${index}`),
    [formValues.children],
  );

  function setFieldRef(fieldName: string, element: HTMLElement | null) {
    fieldRefs.current[fieldName] = element;
  }

  function focusFirstInvalid(errors: SearchFormErrors) {
    const firstInvalidField = getFirstInvalidField(errors, formValues);
    if (!firstInvalidField) {
      return;
    }

    const target = fieldRefs.current[firstInvalidField];
    target?.focus();
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function updateField<K extends keyof SearchFormValues>(field: K, value: SearchFormValues[K]) {
    setFormValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: "" }));
  }

  function handleBlur(fieldName: string, values = formValues) {
    const message = validateSearchField(values, fieldName);
    setFieldErrors((previous) => ({ ...previous, [fieldName]: message ?? "" }));
  }

  function handleChildrenCountChange(nextValue: string) {
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const nextValues = updateChildrenCount(formValues, parsed);
    setFormValues(nextValues);

    setFieldErrors((previous) => {
      const nextErrors: SearchFormErrors = { ...previous, children: "" };
      childAgeFields.forEach((fieldName) => {
        nextErrors[fieldName] = "";
      });
      return nextErrors;
    });
  }

  function handleChildAgeChange(index: number, nextValue: string) {
    setFormValues((previous) => {
      const nextChildrenAges = [...previous.childrenAges];
      nextChildrenAges[index] = nextValue;
      return {
        ...previous,
        childrenAges: nextChildrenAges,
      };
    });

    setFieldErrors((previous) => ({ ...previous, [`childrenAges.${index}`]: "" }));
  }

  function mergeRetriedResults(
    previousState: typeof formState,
    retriedSuppliers: SupplierId[],
    nextState: ReturnType<typeof resolveSearchResult>,
  ): ReturnType<typeof resolveSearchResult> {
    if (previousState.status !== "success") {
      return nextState;
    }

    const preservedResults = previousState.results.filter(
      (hotel) => !retriedSuppliers.includes(hotel.supplier),
    );
    const mergedResults = [...preservedResults, ...nextState.results];

    return {
      ...nextState,
      status: mergedResults.length > 0 ? "success" : nextState.status,
      results: mergedResults,
      supplierStatus: previousState.supplierStatus
        ? {
            ...previousState.supplierStatus,
            ...nextState.supplierStatus,
          }
        : nextState.supplierStatus,
    };
  }

  function focusSearchForm() {
    const destinationInput = fieldRefs.current.destination;
    destinationInput?.focus();
    destinationInput?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function submitValidatedSearch(searchInput: SupplierSearchInput, options?: { suppliers?: SupplierId[] }) {
    setLastSubmittedSearch(searchInput);
    if (!options?.suppliers) {
      const sourceSeed = [
        searchInput.destination,
        searchInput.checkIn,
        searchInput.checkOut,
        String(searchInput.adults),
        String(searchInput.rooms),
        searchInput.childrenAges.join(","),
      ].join("|");
      setSourceLabels(createSourceLabelMapFromSeed(sourceSeed));
      setFormState(beginSearch());
    }

    const previousState = formState;
    const retriedSuppliers = options?.suppliers ?? [];

    startTransition(async () => {
      const result = await searchHotelsAction(searchInput, options);

      if (!result.success) {
        setFormState(resolveSearchError(result.error.message));
        return;
      }

      const nextState = resolveSearchResult(result.data);
      setFormState(
        retriedSuppliers.length > 0
          ? mergeRetriedResults(previousState, retriedSuppliers, nextState)
          : nextState,
      );
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = validateSearchForm(formValues);
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalid(validationResult.errors);
      return;
    }

    setFieldErrors({});
    submitValidatedSearch(validationResult.data);
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border-subtle">
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1 xl:col-span-2">
                <label htmlFor="destination" className="text-sm font-medium text-text-primary">
                  Destination
                </label>
                <Input
                  id="destination"
                  name="destination"
                  ref={(element) => {
                    setFieldRef("destination", element);
                  }}
                  value={formValues.destination}
                  onChange={(event) => updateField("destination", event.currentTarget.value)}
                  onBlur={(event) =>
                    handleBlur("destination", {
                      ...formValues,
                      destination: event.currentTarget.value,
                    })
                  }
                  aria-invalid={fieldErrors.destination ? true : undefined}
                  aria-describedby={getFieldDescribedBy("destination", Boolean(fieldErrors.destination))}
                  placeholder="City, area, or hotel"
                />
                {fieldErrors.destination ? (
                  <p id={getFieldErrorId("destination")} className="text-xs text-error">
                    {fieldErrors.destination}
                  </p>
                ) : null}
              </div>

              <DateField
                id="checkIn"
                label="Check-in"
                value={formValues.checkIn}
                error={fieldErrors.checkIn}
                onChange={(nextValue) => updateField("checkIn", nextValue)}
                onBlur={(nextValue) =>
                  handleBlur("checkIn", {
                    ...formValues,
                    checkIn: nextValue ?? formValues.checkIn,
                  })
                }
                setFieldRef={setFieldRef}
              />

              <DateField
                id="checkOut"
                label="Check-out"
                value={formValues.checkOut}
                error={fieldErrors.checkOut}
                onChange={(nextValue) => updateField("checkOut", nextValue)}
                onBlur={(nextValue) =>
                  handleBlur("checkOut", {
                    ...formValues,
                    checkOut: nextValue ?? formValues.checkOut,
                  })
                }
                setFieldRef={setFieldRef}
              />

              <div className="space-y-1">
                <label htmlFor="adults" className="text-sm font-medium text-text-primary">
                  Adults
                </label>
                <Input
                  id="adults"
                  name="adults"
                  ref={(element) => {
                    setFieldRef("adults", element);
                  }}
                  type="number"
                  min={1}
                  max={6}
                  value={formValues.adults}
                  onChange={(event) => updateField("adults", Number(event.currentTarget.value))}
                  onBlur={(event) =>
                    handleBlur("adults", {
                      ...formValues,
                      adults: Number(event.currentTarget.value),
                    })
                  }
                  aria-invalid={fieldErrors.adults ? true : undefined}
                  aria-describedby={getFieldDescribedBy("adults", Boolean(fieldErrors.adults))}
                />
                {fieldErrors.adults ? (
                  <p id={getFieldErrorId("adults")} className="text-xs text-error">
                    {fieldErrors.adults}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="children" className="text-sm font-medium text-text-primary">
                  Children
                </label>
                <Input
                  id="children"
                  name="children"
                  ref={(element) => {
                    setFieldRef("children", element);
                  }}
                  type="number"
                  min={0}
                  value={formValues.children}
                  onChange={(event) => handleChildrenCountChange(event.currentTarget.value)}
                  onBlur={(event) =>
                    handleBlur("children", updateChildrenCount(formValues, Number(event.currentTarget.value)))
                  }
                  aria-invalid={fieldErrors.children ? true : undefined}
                  aria-describedby={getFieldDescribedBy("children", Boolean(fieldErrors.children))}
                />
                {fieldErrors.children ? (
                  <p id={getFieldErrorId("children")} className="text-xs text-error">
                    {fieldErrors.children}
                  </p>
                ) : null}
              </div>

              {formValues.childrenAges.map((age, index) => {
                const fieldName = `childrenAges.${index}`;

                return (
                  <div key={fieldName} className="space-y-1">
                    <label htmlFor={fieldName} className="text-sm font-medium text-text-primary">
                      Child {index + 1} age
                    </label>
                    <Input
                      id={fieldName}
                      name={fieldName}
                      ref={(element) => {
                        setFieldRef(fieldName, element);
                      }}
                      type="number"
                      min={0}
                      max={17}
                      value={age}
                      onChange={(event) => handleChildAgeChange(index, event.currentTarget.value)}
                      onBlur={(event) => {
                        const nextChildrenAges = [...formValues.childrenAges];
                        nextChildrenAges[index] = event.currentTarget.value;

                        handleBlur(fieldName, {
                          ...formValues,
                          childrenAges: nextChildrenAges,
                        });
                      }}
                      aria-invalid={fieldErrors[fieldName] ? true : undefined}
                      aria-describedby={getFieldDescribedBy(fieldName, Boolean(fieldErrors[fieldName]))}
                    />
                    {fieldErrors[fieldName] ? (
                      <p id={getFieldErrorId(fieldName)} className="text-xs text-error">
                        {fieldErrors[fieldName]}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="size-4" />
                    Search hotels
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SearchResultsSection
        state={formState}
        searchInput={lastSubmittedSearch}
        sourceLabels={sourceLabels}
        onRetry={
          lastSubmittedSearch
            ? (supplier) => submitValidatedSearch(lastSubmittedSearch, supplier ? { suppliers: [supplier] } : undefined)
            : undefined
        }
        onSearchAgain={focusSearchForm}
      />
    </div>
  );
}
