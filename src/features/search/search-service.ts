import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import type { SupplierSearchResult } from "~/features/suppliers/contracts/supplier-schemas";
import { expediaAdapter } from "~/features/suppliers/adapters/expedia-adapter";
import { tboAdapter } from "~/features/suppliers/adapters/tbo-adapter";
import { applyMarkup, getMarkupPercentage } from "~/features/markup/markup-service";

export type SupplierExecutionStatus = "success" | "failed";

export type SearchSupplierStatus = {
  tbo: SupplierExecutionStatus;
  expedia: SupplierExecutionStatus;
};

export type SearchServiceResult = {
  results: SupplierSearchResult[];
  supplierStatus: SearchSupplierStatus;
};

function applyPlatformMarkup(
  results: SupplierSearchResult[],
  markupPercentage: number,
): SupplierSearchResult[] {
  return results.map((result) => ({
    ...result,
    lowestRate: {
      ...result.lowestRate,
      displayAmount: applyMarkup(result.lowestRate.supplierAmount, markupPercentage),
    },
  }));
}

export async function searchHotels(
  input: SupplierSearchInput,
): Promise<SearchServiceResult> {
  const [tboSearchResult, expediaSearchResult] = await Promise.allSettled([
    tboAdapter.search(input),
    expediaAdapter.search(input),
  ]);

  const supplierStatus: SearchSupplierStatus = {
    tbo: "success",
    expedia: "success",
  };

  const results: SupplierSearchResult[] = [];

  if (tboSearchResult.status === "fulfilled") {
    results.push(...tboSearchResult.value);
  } else {
    supplierStatus.tbo = "failed";
  }

  if (expediaSearchResult.status === "fulfilled") {
    results.push(...expediaSearchResult.value);
  } else {
    supplierStatus.expedia = "failed";
  }

  if (results.length === 0) {
    return {
      results,
      supplierStatus,
    };
  }

  const markupPercentage = await getMarkupPercentage();

  return {
    results: applyPlatformMarkup(results, markupPercentage),
    supplierStatus,
  };
}
