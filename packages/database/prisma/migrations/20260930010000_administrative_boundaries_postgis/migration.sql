-- WAYNAH-GEO-004: Administrative Boundary Integration & PostGIS Spatial Authority
-- 
-- Additive migration — no existing data is destroyed.
-- Adds boundary spatial column (geography(MultiPolygon, 4326)) and GiST spatial index
-- to District for authoritative PostGIS boundary-based spatial resolution.

-- AddColumn: District.boundary
ALTER TABLE "districts" ADD COLUMN "boundary" geography(MultiPolygon, 4326);

-- CreateIndex: GiST spatial index on districts.boundary for ST_Covers / ST_Within queries
CREATE INDEX "districts_boundary_idx" ON "districts" USING GIST ("boundary");
