"use client";

import {
  CalendarDaysIcon,
  Loader2Icon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";
import { type FormEvent, useMemo, useRef, useState, useTransition } from "react";

import { searchHotelsAction } from "~/app/(app)/search/actions";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
      <label htmlFor={id} className="sr-only">
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
            className="h-12 w-full justify-start rounded-xl border-0 px-0 text-left text-sm font-semibold shadow-none"
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

function TravelersSummary({ adults, children }: { adults: number; children: number }) {
  const guests = adults + children;
  return `${guests} guest${guests === 1 ? "" : "s"} - 1 room`;
}

export function SearchForm() {
  const [formValues, setFormValues] = useState<SearchFormValues>(() => createDefaultSearchFormValues());
  const [fieldErrors, setFieldErrors] = useState<SearchFormErrors>({});
  const [formState, setFormState] = useState(INITIAL_SEARCH_UI_STATE);
  const [lastSubmittedSearch, setLastSubmittedSearch] = useState<SupplierSearchInput | null>(null);
  const [sourceLabels, setSourceLabels] = useState<SourceLabelMap | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const stayLength = useMemo(() => {
    const checkInDate = parseIsoDate(formValues.checkIn);
    const checkOutDate = parseIsoDate(formValues.checkOut);

    if (!checkInDate || !checkOutDate) {
      return null;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const difference = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / millisecondsPerDay);
    return difference > 0 ? difference : null;
  }, [formValues.checkIn, formValues.checkOut]);

  const formattedCheckIn = parseIsoDate(formValues.checkIn);
  const formattedCheckOut = parseIsoDate(formValues.checkOut);
  const [travelerEditorOpen, setTravelerEditorOpen] = useState(false);

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

  function clearChildAgeErrors(nextErrors: SearchFormErrors) {
    Object.keys(nextErrors)
      .filter((key) => key.startsWith("childrenAges."))
      .forEach((key) => {
        nextErrors[key] = "";
      });
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
      clearChildAgeErrors(nextErrors);
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

  function updateCounter(field: "adults" | "children", delta: number) {
    if (field === "adults") {
      const nextAdults = Math.min(6, Math.max(1, formValues.adults + delta));
      updateField("adults", nextAdults);
      return;
    }

    const nextValues = updateChildrenCount(formValues, formValues.children + delta);
    setFormValues(nextValues);
    setFieldErrors((previous) => {
      const nextErrors: SearchFormErrors = { ...previous, children: "" };
      clearChildAgeErrors(nextErrors);
      return nextErrors;
    });
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
    setTravelerEditorOpen(false);
    submitValidatedSearch(validationResult.data);
  }

  const travelerSummary =
    formValues.children > 0 ? `${formValues.adults} adults, ${formValues.children} children` : `${formValues.adults} adults`;
  const staySummary = stayLength ? `${stayLength} night${stayLength === 1 ? "" : "s"}` : "Select dates";

  return (
    <div className="space-y-6">
      <Card className="overflow-visible border border-border-subtle/80 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-sm">
        <CardHeader className="gap-1 pb-3">
          <CardTitle className="text-[1.9rem] font-semibold tracking-tight">Search</CardTitle>
          <CardDescription className="max-w-2xl text-sm text-text-secondary">
            Compact booking-style hotel search for fast agent workflows.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[1.75rem] border border-border-subtle/80 bg-background/90 p-3 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,2.3fr)_minmax(11.5rem,1fr)_minmax(11.5rem,1fr)_minmax(15rem,1.05fr)_auto] xl:items-stretch">
                <div className="rounded-2xl border border-border-subtle/70 bg-card px-4 py-3 shadow-sm">
                  <label
                    htmlFor="destination"
                    className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.14em] text-text-secondary uppercase"
                  >
                    <MapPinIcon className="size-3.5 text-primary" aria-hidden="true" />
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
                    className="h-12 border-0 px-0 text-base shadow-none focus-visible:ring-0"
                  />
                  {fieldErrors.destination ? (
                    <p id={getFieldErrorId("destination")} className="pt-1 text-xs text-error">
                      {fieldErrors.destination}
                    </p>
                  ) : (
                    <p className="pt-1 text-xs text-text-secondary">City, area, landmark, or hotel name.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-border-subtle/70 bg-card px-4 py-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.14em] text-text-secondary uppercase">
                    <CalendarDaysIcon className="size-3.5 text-primary" aria-hidden="true" />
                    Check-in
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
                </div>

                <div className="rounded-2xl border border-border-subtle/70 bg-card px-4 py-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.14em] text-text-secondary uppercase">
                    <CalendarDaysIcon className="size-3.5 text-primary" aria-hidden="true" />
                    Check-out
                  </div>
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
                </div>

                <div className="rounded-2xl border border-border-subtle/70 bg-card px-4 py-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.14em] text-text-secondary uppercase">
                    <UsersIcon className="size-3.5 text-primary" aria-hidden="true" />
                    Travelers
                  </div>
                  <Popover open={travelerEditorOpen} onOpenChange={setTravelerEditorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full justify-start rounded-xl border-0 px-0 text-left text-sm font-semibold shadow-none"
                      >
                        <span className="truncate">{TravelersSummary({ adults: formValues.adults, children: formValues.children })}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[22rem] rounded-2xl border border-border-subtle/80 p-4" align="end">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-text-primary">Travelers and room</p>
                          <p className="text-xs text-text-secondary">Keep the main bar compact and adjust guest details here.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle/70 bg-background px-3 py-3">
                            <div>
                              <p className="text-sm font-medium text-text-primary">Adults</p>
                              <p className="text-xs text-text-secondary">Ages 18+</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => updateCounter("adults", -1)}>
                                <MinusIcon className="size-3.5" />
                              </Button>
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
                                className="h-10 w-12 border-0 px-0 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
                              />
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => updateCounter("adults", 1)}>
                                <PlusIcon className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          {fieldErrors.adults ? (
                            <p id={getFieldErrorId("adults")} className="-mt-1 text-xs text-error">
                              {fieldErrors.adults}
                            </p>
                          ) : null}

                          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle/70 bg-background px-3 py-3">
                            <div>
                              <p className="text-sm font-medium text-text-primary">Children</p>
                              <p className="text-xs text-text-secondary">Ages 0-17</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => updateCounter("children", -1)}>
                                <MinusIcon className="size-3.5" />
                              </Button>
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
                                className="h-10 w-12 border-0 px-0 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
                              />
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => updateCounter("children", 1)}>
                                <PlusIcon className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          {fieldErrors.children ? (
                            <p id={getFieldErrorId("children")} className="-mt-1 text-xs text-error">
                              {fieldErrors.children}
                            </p>
                          ) : null}

                          <div className="rounded-xl border border-border-subtle/70 bg-background px-3 py-3">
                            <p className="text-sm font-medium text-text-primary">Rooms</p>
                            <p className="mt-1 text-xs text-text-secondary">Fixed at 1 room for the current MVP scope.</p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="button" onClick={() => setTravelerEditorOpen(false)}>
                            Done
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="h-full min-h-16 rounded-2xl px-6 text-sm font-semibold shadow-sm xl:min-h-0"
                >
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
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span className="rounded-full border border-border-subtle bg-card px-3 py-1.5">{staySummary}</span>
              <span className="rounded-full border border-border-subtle bg-card px-3 py-1.5">{travelerSummary}</span>
              <span className="rounded-full border border-border-subtle bg-card px-3 py-1.5">1 room</span>
              {formattedCheckIn && formattedCheckOut ? (
                <span className="rounded-full border border-border-subtle bg-card px-3 py-1.5">
                  {DATE_LABEL_FORMATTER.format(formattedCheckIn)} - {DATE_LABEL_FORMATTER.format(formattedCheckOut)}
                </span>
              ) : null}
              <span className="rounded-full border border-border-subtle bg-card px-3 py-1.5">Validated live search</span>
            </div>

            {formValues.childrenAges.length > 0 ? (
              <div className="rounded-2xl border border-border-subtle/80 bg-card px-4 py-4 shadow-sm">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-text-primary">Children ages</p>
                  <p className="text-xs text-text-secondary">Keep these as a compact secondary detail for the search request.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {formValues.childrenAges.map((age, index) => {
                    const fieldName = `childrenAges.${index}`;

                    return (
                      <div key={fieldName} className="space-y-1.5 rounded-xl border border-border-subtle/70 bg-background px-3 py-3">
                        <label htmlFor={fieldName} className="text-xs font-semibold tracking-[0.14em] text-text-secondary uppercase">
                          Child {index + 1}
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
                          placeholder="Age"
                          className="h-10 shadow-none"
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
              </div>
            ) : null}
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
