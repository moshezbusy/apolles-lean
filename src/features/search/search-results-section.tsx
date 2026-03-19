import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { HotelResultCard } from "~/features/search/hotel-result-card";
import { SearchResultsBanner } from "~/features/search/search-results-banner";
import { getSupplierFailures, type SearchUiState } from "~/features/search/search-form-state";
import { SearchResultsSkeleton } from "~/features/search/search-results-skeleton";
import {
  DEFAULT_SOURCE_LABEL_MAP,
  getSourceLabel,
  type SourceLabelMap,
} from "~/features/search/source-labels";
import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import type { SupplierId } from "~/features/suppliers/contracts/supplier-schemas";

type Props = {
  state: SearchUiState;
  searchInput: SupplierSearchInput | null;
  sourceLabels: SourceLabelMap | null;
  onRetry?: (supplier: SupplierId | null) => void;
  onSearchAgain?: () => void;
};

export function SearchResultsSection({
  state,
  searchInput,
  sourceLabels,
  onRetry,
  onSearchAgain,
}: Props) {
  const activeSourceLabels = sourceLabels ?? DEFAULT_SOURCE_LABEL_MAP;
  const supplierFailures = getSupplierFailures(state.supplierStatus);
  const failedSources = supplierFailures.map((supplier) => ({
    supplier,
    label: getSourceLabel(supplier, activeSourceLabels),
  }));
  const resultCount = state.status === "success" ? state.results.length : 0;
  const statusLabel =
    state.status === "loading"
      ? "Searching"
      : state.status === "success"
        ? `${resultCount} hotel${resultCount === 1 ? "" : "s"}`
        : state.status === "empty"
          ? "No matches"
          : state.status === "error"
            ? "Attention needed"
            : "Awaiting search";

  return (
    <section aria-live="polite">
      <Card className="border border-border-subtle/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-sm">
        <CardHeader className="gap-3 border-b border-border-subtle/80 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight">Results</CardTitle>
              <CardDescription className="text-sm text-text-secondary">
                Live hotel availability appears here after search, with clear loading, empty, and retry states.
              </CardDescription>
            </div>

            <div className="rounded-full border border-border-subtle/80 bg-background/85 px-3 py-1 text-xs font-medium text-text-secondary">
              {statusLabel}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <SearchResultsBanner failedSources={failedSources} onRetry={onRetry} />

          {state.status === "idle" ? (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-background/80 px-6 py-10 text-center text-sm text-text-secondary">
              <p className="text-base font-semibold text-text-primary">Search hotels to populate your result set.</p>
              <p className="mx-auto mt-2 max-w-2xl leading-6">
                The page keeps the search bar anchored above and brings matching inventory, empty states, and supplier feedback into one connected workspace.
              </p>
            </div>
          ) : null}

          {state.status === "loading" ? <SearchResultsSkeleton /> : null}

          {state.status === "error" ? (
            <div className="rounded-2xl border border-error/30 bg-error-bg px-5 py-5 text-sm text-error">
              <p className="font-medium">{state.errorMessage ?? "Search failed. Please try again."}</p>
              <p className="mt-2 text-error/80">Keep the criteria visible, adjust the search if needed, or retry all suppliers.</p>
              {onRetry ? (
                <div className="mt-4">
                  <Button type="button" variant="outline" onClick={() => onRetry(null)}>
                    Retry All
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {state.status === "empty" ? (
            <div className="rounded-2xl border border-border-subtle bg-background/85 px-6 py-8 text-sm text-text-secondary">
              <p className="text-base font-semibold text-text-primary">No hotels found for these dates. Try different dates or destination.</p>
              <p className="mt-2 max-w-2xl leading-6">
                The search completed successfully, but nothing matched the current criteria. Updating the stay window or destination is the quickest next step.
              </p>
              {onSearchAgain ? (
                <div className="mt-4">
                  <Button type="button" variant="outline" onClick={onSearchAgain}>
                    Search Again
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {state.status === "success" && searchInput ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {state.results.map((hotel) => (
                <HotelResultCard
                  key={`${hotel.supplier}-${hotel.supplierHotelId}`}
                  hotel={hotel}
                  searchInput={searchInput}
                  sourceLabels={activeSourceLabels}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
