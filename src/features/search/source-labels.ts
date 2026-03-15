import type { SupplierId } from "~/features/suppliers/contracts/supplier-schemas";

export type SourceLabelMap = Record<SupplierId, string>;

const SOURCE_A = "Source A";
const SOURCE_B = "Source B";

export function createSourceLabelMap(primarySupplier: SupplierId): SourceLabelMap {
  return primarySupplier === "tbo"
    ? { tbo: SOURCE_A, expedia: SOURCE_B }
    : { tbo: SOURCE_B, expedia: SOURCE_A };
}

export function createSourceLabelMapFromSeed(seed: string): SourceLabelMap {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return createSourceLabelMap(hash % 2 === 0 ? "tbo" : "expedia");
}

export const DEFAULT_SOURCE_LABEL_MAP: SourceLabelMap = createSourceLabelMap("tbo");

export function getSourceLabel(
  supplier: SupplierId,
  sourceLabels: SourceLabelMap = DEFAULT_SOURCE_LABEL_MAP,
): string {
  return sourceLabels[supplier];
}
