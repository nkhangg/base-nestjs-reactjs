-- AlterTable
ALTER TABLE "users" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "streakCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xpTotal" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "users_xpTotal_idx" ON "users"("xpTotal");
