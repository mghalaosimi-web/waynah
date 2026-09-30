-- WAYNAH-GEO-001: Geographic Data Foundation
-- 
-- Additive migration — no existing data is destroyed.
-- Adds stable external identifiers and uniqueness constraints
-- to Governorate and District for authoritative geographic data import.

-- AddColumn: Governorate.external_id
-- Stable identifier from authoritative source (e.g. OCHA pcode).
-- Nullable: existing records are not required to have an external ID.
ALTER TABLE "governorates" ADD COLUMN "external_id" TEXT;

-- CreateIndex: governorates.external_id (unique, partial — NULL values excluded)
-- Two records with external_id = NULL are permitted (no source yet).
-- Two records with the same non-null external_id are not permitted.
CREATE UNIQUE INDEX "governorates_external_id_key"
  ON "governorates"("external_id")
  WHERE "external_id" IS NOT NULL;

-- AddColumn: District.external_id
-- Stable identifier from authoritative source (e.g. OCHA pcode).
-- Nullable: existing records are not required to have an external ID.
ALTER TABLE "districts" ADD COLUMN "external_id" TEXT;

-- CreateIndex: districts.external_id (unique, partial — NULL values excluded)
CREATE UNIQUE INDEX "districts_external_id_key"
  ON "districts"("external_id")
  WHERE "external_id" IS NOT NULL;

-- CreateIndex: districts(governorate_id, name_ar) UNIQUE
-- Enforces that district names are unique within their governorate.
-- District names are NOT globally unique across Yemen.
-- This prevents duplicate district records during idempotent imports.
CREATE UNIQUE INDEX "districts_governorate_id_name_ar_key"
  ON "districts"("governorate_id", "name_ar");
