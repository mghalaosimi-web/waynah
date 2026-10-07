-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'CLAIMED', 'REPORTED', 'CLOSED');

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governorates" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "governorate_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "website" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "category_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_locations" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geom" geography(Point,4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reliability_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_observations" (
    "id" TEXT NOT NULL,
    "place_id" TEXT,
    "data_source_id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "category_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geom" geography(Point,4326),
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_conflicts" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_observation_id" TEXT NOT NULL,
    "conflicting_observation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "governorates_code_key" ON "governorates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "place_locations_place_id_key" ON "place_locations"("place_id");

-- CreateIndex
CREATE INDEX "place_locations_geom_idx" ON "place_locations" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "place_observations_geom_idx" ON "place_observations" USING GIST ("geom");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_locations" ADD CONSTRAINT "place_locations_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_observations" ADD CONSTRAINT "place_observations_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_observations" ADD CONSTRAINT "place_observations_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_conflicts" ADD CONSTRAINT "data_conflicts_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
