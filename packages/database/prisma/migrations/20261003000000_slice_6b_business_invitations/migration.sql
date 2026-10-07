-- CreateEnum
CREATE TYPE "BusinessInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "business_invitations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "BusinessRole" NOT NULL DEFAULT 'MEMBER',
    "inviter_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "BusinessInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_invitations_token_hash_key" ON "business_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "business_invitations_business_id_idx" ON "business_invitations"("business_id");

-- CreateIndex
CREATE INDEX "business_invitations_email_idx" ON "business_invitations"("email");

-- CreateIndex
CREATE INDEX "business_invitations_business_id_email_status_idx" ON "business_invitations"("business_id", "email", "status");

-- AddForeignKey
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
