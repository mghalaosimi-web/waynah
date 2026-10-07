-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "action" TEXT,
    "method" TEXT,
    "path" TEXT,
    "ip" TEXT,
    "actor_id" TEXT,
    "actor_type" TEXT,
    "actor_role" TEXT,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "business_id" TEXT,
    "place_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_business_id_idx" ON "audit_logs"("business_id");

-- CreateIndex
CREATE INDEX "audit_logs_place_id_idx" ON "audit_logs"("place_id");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("created_at");
