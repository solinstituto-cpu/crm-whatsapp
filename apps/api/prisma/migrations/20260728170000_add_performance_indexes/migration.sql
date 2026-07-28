-- Performance indexes for Contact table (had ZERO indexes)
CREATE INDEX IF NOT EXISTS "contacts_whatsappAccountId_idx" ON "contacts"("whatsappAccountId");
CREATE INDEX IF NOT EXISTS "contacts_customerStatus_idx" ON "contacts"("customerStatus");
CREATE INDEX IF NOT EXISTS "contacts_optedOut_idx" ON "contacts"("optedOut");
CREATE INDEX IF NOT EXISTS "contacts_createdAt_idx" ON "contacts"("createdAt");
CREATE INDEX IF NOT EXISTS "contacts_lastMessageAt_idx" ON "contacts"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "contacts_assignedToId_idx" ON "contacts"("assignedToId");

-- Performance indexes for Conversation table
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");
CREATE INDEX IF NOT EXISTS "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "conversations_contactId_idx" ON "conversations"("contactId");
CREATE INDEX IF NOT EXISTS "conversations_assignedToId_idx" ON "conversations"("assignedToId");
CREATE INDEX IF NOT EXISTS "conversations_whatsappAccountId_status_idx" ON "conversations"("whatsappAccountId", "status");

-- Performance indexes for Message table (had ZERO indexes)
CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");
CREATE INDEX IF NOT EXISTS "messages_waMessageId_idx" ON "messages"("waMessageId");

-- Additional indexes for Campaign table
CREATE INDEX IF NOT EXISTS "campaigns_status_whatsappAccountId_idx" ON "campaigns"("status", "whatsappAccountId");
CREATE INDEX IF NOT EXISTS "campaigns_createdAt_idx" ON "campaigns"("createdAt");
