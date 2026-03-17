-- AlterTable - Add new fields to Deal
ALTER TABLE "deals" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Novo Deal';
ALTER TABLE "deals" ADD COLUMN "description" TEXT;
ALTER TABLE "deals" ADD COLUMN "probability" INTEGER DEFAULT 50;
ALTER TABLE "deals" ADD COLUMN "expectedCloseDate" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "wonAt" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "lostAt" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "source" TEXT;
ALTER TABLE "deals" ADD COLUMN "lostReason" TEXT;

-- Remove old notes column and rename to description (if exists)
-- Note: We're adding description as new column, notes can be migrated manually if needed
