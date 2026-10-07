-- CreateEnum
CREATE TYPE "AccountTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "account_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AccountTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_tokens_token_hash_key" ON "account_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "account_tokens_user_id_type_idx" ON "account_tokens"("user_id", "type");

-- AddForeignKey
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
