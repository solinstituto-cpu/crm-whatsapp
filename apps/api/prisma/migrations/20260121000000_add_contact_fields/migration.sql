-- AlterTable
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- AlterTable: Make contactId nullable and change onDelete behavior
ALTER TABLE "conversations" ALTER COLUMN "contactId" DROP NOT NULL;
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_contactId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contactId_fkey" 
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
