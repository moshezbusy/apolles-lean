import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import type { SupplierSearchResult } from "~/features/suppliers/contracts/supplier-schemas";
import { expediaAdapter } from "~/features/suppliers/adapters/expedia-adapter";
import { tboAdapter } from "~/features/suppliers/adapters/tbo-adapter";
import { applyMarkup, getMarkupPercentage } from "~/features/markup/markup-service";
import { AppError, ErrorCodes } from "~/lib/errors";

export const SEARCH_TIMEOUT_MS = 5_000;

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
  return results.map((result) => {
    const markedUpAmount = applyMarkup(result.lowestRate.supplierAmount, markupPercentage);

    return {
      ...result,
      lowestRate: {
        ...result.lowestRate,
        supplierAmount: markedUpAmount,
        displayAmount: markedUpAmount,
      },
    };
  });
}

async function withSearchTimeout<T>(
  promise: Promise<T>,
  supplier: "tbo" | "expedia",
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new AppError(
          ErrorCodes.SUPPLIER_TIMEOUT,
          `${supplier.toUpperCase()} supplier request timed out after 5 seconds`,
        ),
      );
    }, SEARCH_TIMEOUT_MS);

    void promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export async function searchHotels(
  input: SupplierSearchInput,
): Promise<SearchServiceResult> {
  const [tboSearchResult, expediaSearchResult] = await Promise.allSettled([
    withSearchTimeout(tboAdapter.search(input), "tbo"),
    withSearchTimeout(expediaAdapter.search(input), "expedia"),
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
