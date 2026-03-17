-- Tabela de relacionamento: Usuários <-> Contas WhatsApp
-- Se um usuário não tem nenhuma conta atribuída, ele vê TODAS (para compatibilidade e admins)

-- CreateTable (se não existir)
CREATE TABLE IF NOT EXISTS "user_whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_whatsapp_accounts_userId_idx" ON "user_whatsapp_accounts"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_whatsapp_accounts_accountId_idx" ON "user_whatsapp_accounts"("accountId");

-- CreateIndex (unique constraint para evitar duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS "user_whatsapp_accounts_userId_accountId_key" ON "user_whatsapp_accounts"("userId", "accountId");

-- AddForeignKey (userId -> users)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_whatsapp_accounts_userId_fkey'
    ) THEN
        ALTER TABLE "user_whatsapp_accounts" ADD CONSTRAINT "user_whatsapp_accounts_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (accountId -> whatsapp_accounts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_whatsapp_accounts_accountId_fkey'
    ) THEN
        ALTER TABLE "user_whatsapp_accounts" ADD CONSTRAINT "user_whatsapp_accounts_accountId_fkey" 
        FOREIGN KEY ("accountId") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
