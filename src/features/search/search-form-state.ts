import type { SearchServiceResult, SearchSupplierStatus } from "~/features/search/search-service";
import type { SupplierSearchResult } from "~/features/suppliers/contracts/supplier-schemas";

export type SearchUiStatus = "idle" | "loading" | "success" | "empty" | "error";

export type SearchUiState = {
  status: SearchUiStatus;
  results: SupplierSearchResult[];
  supplierStatus: SearchSupplierStatus | null;
  errorMessage: string | null;
};

export const INITIAL_SEARCH_UI_STATE: SearchUiState = {
  status: "idle",
  results: [],
  supplierStatus: null,
  errorMessage: null,
};

export function beginSearch(): SearchUiState {
  return {
    status: "loading",
    results: [],
    supplierStatus: null,
    errorMessage: null,
  };
}

export function resolveSearchResult(result: SearchServiceResult): SearchUiState {
  if (result.results.length === 0 && result.supplierStatus.tbo === "failed" && result.supplierStatus.expedia === "failed") {
    return {
      status: "error",
      results: [],
      supplierStatus: result.supplierStatus,
      errorMessage: "Unable to load results. Please try again.",
    };
  }

  if (result.results.length === 0) {
    return {
      status: "empty",
      results: [],
      supplierStatus: result.supplierStatus,
      errorMessage: null,
    };
  }

  return {
    status: "success",
    results: result.results,
    supplierStatus: result.supplierStatus,
    errorMessage: null,
  };
}

export function resolveSearchError(message: string): SearchUiState {
  return {
    status: "error",
    results: [],
    supplierStatus: null,
    errorMessage: message,
  };
}

export function getSupplierFailures(supplierStatus: SearchSupplierStatus | null): Array<"tbo" | "expedia"> {
  if (!supplierStatus) {
    return [];
  }

  const failedSuppliers: Array<"tbo" | "expedia"> = [];

  if (supplierStatus.tbo === "failed") {
    failedSuppliers.push("tbo");
  }

  if (supplierStatus.expedia === "failed") {
    failedSuppliers.push("expedia");
  }

  return failedSuppliers;
}
