-- Phase 11 — Discovery & Search Optimization Additive Search Indexes
-- Pure additive index creation for PostgreSQL pg_trgm, Arabic tsvector FTS, and administrative filters.

-- 1. Places B-tree & GIN Indexes
CREATE INDEX IF NOT EXISTS "places_category_id_idx" ON "places"("category_id");
CREATE INDEX IF NOT EXISTS "places_district_id_idx" ON "places"("district_id");

CREATE INDEX IF NOT EXISTS "places_name_ar_trgm_idx" ON "places" USING gin ("name_ar" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "places_name_en_trgm_idx" ON "places" USING gin ("name_en" gin_trgm_ops) WHERE "name_en" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "places_name_ar_fts_idx" ON "places" USING gin (to_tsvector('arabic', "name_ar"));

-- 2. Businesses GIN Indexes
CREATE INDEX IF NOT EXISTS "businesses_name_trgm_idx" ON "businesses" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "businesses_name_fts_idx" ON "businesses" USING gin (to_tsvector('arabic', "name"));

-- 3. Products GIN Indexes
CREATE INDEX IF NOT EXISTS "products_name_ar_trgm_idx" ON "products" USING gin ("name_ar" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_name_ar_fts_idx" ON "products" USING gin (to_tsvector('arabic', "name_ar"));

-- 4. Service Items GIN Indexes
CREATE INDEX IF NOT EXISTS "service_items_name_ar_trgm_idx" ON "service_items" USING gin ("name_ar" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "service_items_name_ar_fts_idx" ON "service_items" USING gin (to_tsvector('arabic', "name_ar"));
