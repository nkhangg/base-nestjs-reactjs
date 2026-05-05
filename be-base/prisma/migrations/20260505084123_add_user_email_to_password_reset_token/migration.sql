-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "userEmail" TEXT NOT NULL DEFAULT '';
