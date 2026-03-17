-- AlterTable: Add phoneE164 to conversations to preserve phone number when contact is deleted
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "phoneE164" TEXT;

-- Populate phoneE164 from existing contacts
UPDATE "conversations" c
SET "phoneE164" = ct."phoneE164"
FROM "contacts" ct
WHERE c."contactId" = ct."id" AND c."phoneE164" IS NULL;
