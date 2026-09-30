-- CreateEnum
CREATE TYPE "BusinessVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "business_verifications" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "status" "BusinessVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "reviewer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_verifications_business_id_key" ON "business_verifications"("business_id");

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
