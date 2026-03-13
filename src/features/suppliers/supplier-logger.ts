import type { Prisma } from "@prisma/client";
import type { SupplierId } from "~/features/suppliers/contracts/supplier-schemas";
import { db } from "~/lib/db";

export type SupplierApiLogInput = {
  supplier: SupplierId;
  method: string;
  endpoint: string;
  requestBody?: Prisma.SupplierApiLogCreateInput["requestBody"];
  responseBody?: Prisma.SupplierApiLogCreateInput["responseBody"];
  responseStatus?: number;
  durationMs: number;
  errorMessage?: string;
};

type LoggedExecutionResult<TData> = {
  data: TData;
  responseBody?: Prisma.SupplierApiLogCreateInput["responseBody"];
  responseStatus?: number;
};

const SUPPLIER_TO_DB = {
  tbo: "TBO",
  expedia: "EXPEDIA",
} as const satisfies Record<SupplierId, Prisma.SupplierApiLogCreateInput["supplier"]>;

function toDbSupplier(supplier: SupplierId): Prisma.SupplierApiLogCreateInput["supplier"] {
  return SUPPLIER_TO_DB[supplier];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown supplier error";
}

export async function logSupplierApiCall(input: SupplierApiLogInput) {
  const data: Prisma.SupplierApiLogCreateInput = {
    supplier: toDbSupplier(input.supplier),
    method: input.method,
    endpoint: input.endpoint,
    requestBody: input.requestBody,
    responseBody: input.responseBody,
    responseStatus: input.responseStatus,
    durationMs: input.durationMs,
    errorMessage: input.errorMessage,
  };

  await db.supplierApiLog.create({
    data,
  });
}

async function tryLogSupplierApiCall(input: SupplierApiLogInput): Promise<void> {
  try {
    await logSupplierApiCall(input);
  } catch {
    // Logging is non-blocking by design: never break business flow.
  }
}

export async function withSupplierApiLogging<TData>(params: {
  supplier: SupplierId;
  method: string;
  endpoint: string;
  requestBody?: Prisma.SupplierApiLogCreateInput["requestBody"];
  execute: () => Promise<LoggedExecutionResult<TData>>;
}): Promise<TData> {
  const startedAtMs = Date.now();

  try {
    const result = await params.execute();

    await tryLogSupplierApiCall({
      supplier: params.supplier,
      method: params.method,
      endpoint: params.endpoint,
      requestBody: params.requestBody,
      responseBody: result.responseBody,
      responseStatus: result.responseStatus,
      durationMs: Date.now() - startedAtMs,
    });

    return result.data;
  } catch (error) {
    await tryLogSupplierApiCall({
      supplier: params.supplier,
      method: params.method,
      endpoint: params.endpoint,
      requestBody: params.requestBody,
      durationMs: Date.now() - startedAtMs,
      errorMessage: getErrorMessage(error),
    });

    throw error;
  }
}
