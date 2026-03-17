-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "lastMessageAt" TIMESTAMP(3);

-- Populate lastMessageAt with existing data (latest message createdAt for each conversation)
UPDATE "conversations" c
SET "lastMessageAt" = (
  SELECT MAX(m."createdAt")
  FROM "messages" m
  WHERE m."conversationId" = c.id
);
