import { AlertTriangleIcon, RefreshCcwIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import type { SupplierId } from "~/features/suppliers/contracts/supplier-schemas";

type Props = {
  failedSources: Array<{
    supplier: SupplierId;
    label: string;
  }>;
  onRetry?: (supplier: SupplierId | null) => void;
};

function buildBannerCopy(failedSources: Props["failedSources"]): string {
  if (failedSources.length === 1) {
    const [failedSource] = failedSources;
    if (!failedSource) {
      return "A supplier is temporarily unavailable. Retry to search again.";
    }

    return `${failedSource.label} is temporarily unavailable. Retry to check that source again.`;
  }

  if (failedSources.length === 2) {
    const [firstSource, secondSource] = failedSources;
    if (!firstSource || !secondSource) {
      return "A supplier is temporarily unavailable. Retry to search again.";
    }

    return `${firstSource.label} and ${secondSource.label} are temporarily unavailable. Retry to check those sources again.`;
  }

  return "A supplier is temporarily unavailable. Retry to search again.";
}

export function SearchResultsBanner({ failedSources, onRetry }: Props) {
  if (failedSources.length === 0) {
    return null;
  }

  const firstFailedSource = failedSources[0] ?? null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-4 text-amber-950 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Supplier availability issue</p>
          <p className="text-sm text-amber-900/90">{buildBannerCopy(failedSources)}</p>
        </div>
      </div>

      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className="border-amber-300 bg-white text-amber-950"
          onClick={() => onRetry(failedSources.length === 1 ? firstFailedSource?.supplier ?? null : null)}
        >
          <RefreshCcwIcon className="size-4" />
          Retry {failedSources.length === 1 ? firstFailedSource?.label ?? "selected source" : "all unavailable sources"}
        </Button>
      ) : null}
    </div>
  );
}
