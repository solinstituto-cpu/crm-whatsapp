-- CreateTable: WhatsAppAccount (Multi-números)
CREATE TABLE IF NOT EXISTS "whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL DEFAULT 'sol_verify_token',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique phoneNumberId
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_accounts_phoneNumberId_key" ON "whatsapp_accounts"("phoneNumberId");

-- AlterTable: Add whatsappAccountId to Conversation (NULLABLE - não quebra nada!)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "whatsappAccountId" TEXT;

-- CreateIndex: Index for whatsappAccountId in conversations
CREATE INDEX IF NOT EXISTS "conversations_whatsappAccountId_idx" ON "conversations"("whatsappAccountId");

-- AlterTable: Add whatsappAccountId to Campaign (NULLABLE - não quebra nada!)
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "whatsappAccountId" TEXT;

-- CreateIndex: Index for whatsappAccountId in campaigns  
CREATE INDEX IF NOT EXISTS "campaigns_whatsappAccountId_idx" ON "campaigns"("whatsappAccountId");

-- AddForeignKey: Conversation -> WhatsAppAccount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_whatsappAccountId_fkey'
    ) THEN
        ALTER TABLE "conversations" ADD CONSTRAINT "conversations_whatsappAccountId_fkey" 
        FOREIGN KEY ("whatsappAccountId") REFERENCES "whatsapp_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Campaign -> WhatsAppAccount
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_whatsappAccountId_fkey'
    ) THEN
        ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_whatsappAccountId_fkey" 
        FOREIGN KEY ("whatsappAccountId") REFERENCES "whatsapp_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
