-- AlterTable
ALTER TABLE "app_configs" ADD COLUMN     "valueKeyOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "value" SET DATA TYPE JSONB;
