-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "conversations" ADD COLUMN "assignedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "conversations_assignedToId_idx" ON "conversations"("assignedToId");
