import { Button } from "~/components/ui/button";
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

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-text-primary">Results</h2>
      </div>

      <SearchResultsBanner failedSources={failedSources} onRetry={onRetry} />

      {state.status === "idle" ? (
        <p className="rounded-xl border border-border-subtle bg-card px-4 py-5 text-sm text-text-secondary">
          Submit a search to view hotel results.
        </p>
      ) : null}

      {state.status === "loading" ? <SearchResultsSkeleton /> : null}

      {state.status === "error" ? (
        <div className="rounded-xl border border-error/30 bg-error-bg px-4 py-5 text-sm text-error">
          <p>{state.errorMessage ?? "Search failed. Please try again."}</p>
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
        <div className="rounded-xl border border-border-subtle bg-card px-4 py-5 text-sm text-text-secondary">
          <p>No hotels found for these dates. Try different dates or destination.</p>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </section>
  );
}
