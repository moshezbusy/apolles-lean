-- CreateEnum
CREATE TYPE "Supplier" AS ENUM ('tbo', 'expedia');

-- CreateTable
CREATE TABLE "supplier_api_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier" "Supplier" NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_body" JSONB,
    "response_body" JSONB,
    "response_status" INTEGER,
    "duration_ms" INTEGER NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_api_logs_pkey" PRIMARY KEY ("id")
);
