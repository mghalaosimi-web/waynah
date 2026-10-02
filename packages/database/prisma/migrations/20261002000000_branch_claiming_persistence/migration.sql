-- CreateEnum
CREATE TYPE "BranchClaimStatus" AS ENUM ('PENDING_REVIEW', 'PENDING_DISPUTE', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "branch_claims" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "claimant_id" TEXT NOT NULL,
    "status" "BranchClaimStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "notes" TEXT,
    "reviewer_id" TEXT,
    "rejection_reason" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "branch_claims_business_id_idx" ON "branch_claims"("business_id");
CREATE INDEX "branch_claims_place_id_idx" ON "branch_claims"("place_id");
CREATE INDEX "branch_claims_claimant_id_idx" ON "branch_claims"("claimant_id");
CREATE INDEX "branch_claims_status_idx" ON "branch_claims"("status");

-- Partial Unique Index for Active Claims (Enforces only one active claim per business + place)
CREATE UNIQUE INDEX "branch_claims_active_business_place_idx" ON "branch_claims"("business_id", "place_id") WHERE "status" IN ('PENDING_REVIEW', 'PENDING_DISPUTE');

-- AddForeignKeys
ALTER TABLE "branch_claims" ADD CONSTRAINT "branch_claims_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_claims" ADD CONSTRAINT "branch_claims_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_claims" ADD CONSTRAINT "branch_claims_claimant_id_fkey" FOREIGN KEY ("claimant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_claims" ADD CONSTRAINT "branch_claims_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
