-- Add user identity metadata to sessions so refresh works without the expired access token
ALTER TABLE "sessions" ADD COLUMN "userEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "sessions" ADD COLUMN "userType" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "sessions" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;
