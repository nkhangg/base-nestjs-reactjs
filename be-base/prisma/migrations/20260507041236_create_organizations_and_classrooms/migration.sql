-- DropForeignKey
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_orgId_fkey";

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
