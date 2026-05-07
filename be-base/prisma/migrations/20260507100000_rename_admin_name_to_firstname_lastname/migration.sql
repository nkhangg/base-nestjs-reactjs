-- Rename name → firstName, add lastName on admins table
ALTER TABLE "admins" RENAME COLUMN "name" TO "firstName";
ALTER TABLE "admins" ADD COLUMN "lastName" TEXT;
