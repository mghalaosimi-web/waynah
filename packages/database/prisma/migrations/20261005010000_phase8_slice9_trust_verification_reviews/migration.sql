-- Phase 8 / Slice 9: Trust, Verification, Observation & Review System Additive Migration

-- CreateEnum: ReviewStatus
DO $$ BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'FLAGGED', 'HIDDEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: data_sources
CREATE TABLE IF NOT EXISTS "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reliability_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable: place_observations
CREATE TABLE IF NOT EXISTS "place_observations" (
    "id" TEXT NOT NULL,
    "place_id" TEXT,
    "data_source_id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "category_id" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geom" geography(Point, 4326),
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verification_logs
CREATE TABLE IF NOT EXISTS "verification_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "verification_id" TEXT,
    "status" "BusinessVerificationStatus" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL DEFAULT 'USER',
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "place_id" TEXT,
    "product_id" TEXT,
    "service_id" TEXT,
    "order_id" TEXT,
    "booking_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateForeignKeys & Indexes if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_observations_place_id_fkey') THEN
        ALTER TABLE "place_observations" ADD CONSTRAINT "place_observations_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_observations_data_source_id_fkey') THEN
        ALTER TABLE "place_observations" ADD CONSTRAINT "place_observations_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'verification_logs_business_id_fkey') THEN
        ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'verification_logs_verification_id_fkey') THEN
        ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "business_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_business_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_place_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_service_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_order_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_booking_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "verification_logs_business_id_idx" ON "verification_logs"("business_id");
CREATE INDEX IF NOT EXISTS "verification_logs_verification_id_idx" ON "verification_logs"("verification_id");
CREATE INDEX IF NOT EXISTS "verification_logs_actor_id_idx" ON "verification_logs"("actor_id");
CREATE INDEX IF NOT EXISTS "reviews_business_id_idx" ON "reviews"("business_id");
CREATE INDEX IF NOT EXISTS "reviews_user_id_idx" ON "reviews"("user_id");
CREATE INDEX IF NOT EXISTS "reviews_place_id_idx" ON "reviews"("place_id");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");
