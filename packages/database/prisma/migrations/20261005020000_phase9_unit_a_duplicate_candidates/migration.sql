-- CreateEnum
CREATE TYPE "DuplicateCandidateStatus" AS ENUM ('PENDING', 'MERGED', 'IGNORED');

-- CreateTable
CREATE TABLE "duplicate_candidates" (
    "id" TEXT NOT NULL,
    "source_place_id" TEXT NOT NULL,
    "target_place_id" TEXT NOT NULL,
    "candidate_score" DOUBLE PRECISION NOT NULL,
    "match_reasons" JSONB NOT NULL,
    "status" "DuplicateCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duplicate_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "duplicate_candidates_source_place_id_idx" ON "duplicate_candidates"("source_place_id");

-- CreateIndex
CREATE INDEX "duplicate_candidates_target_place_id_idx" ON "duplicate_candidates"("target_place_id");

-- CreateIndex
CREATE INDEX "duplicate_candidates_status_idx" ON "duplicate_candidates"("status");

-- CreateIndex
CREATE INDEX "duplicate_candidates_candidate_score_idx" ON "duplicate_candidates"("candidate_score");

-- CreateIndex
CREATE UNIQUE INDEX "duplicate_candidates_source_place_id_target_place_id_key" ON "duplicate_candidates"("source_place_id", "target_place_id");

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_source_place_id_fkey" FOREIGN KEY ("source_place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_target_place_id_fkey" FOREIGN KEY ("target_place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
