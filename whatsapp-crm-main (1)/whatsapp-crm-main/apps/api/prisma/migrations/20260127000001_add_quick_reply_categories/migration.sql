-- Adiciona campos para respostas rápidas com categorias

-- Tabela de categorias de respostas rápidas
CREATE TABLE IF NOT EXISTS "quick_reply_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_reply_categories_pkey" PRIMARY KEY ("id")
);

-- Adiciona novos campos na tabela quick_replies
ALTER TABLE "quick_replies" ADD COLUMN IF NOT EXISTS "shortcut" TEXT;
ALTER TABLE "quick_replies" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "quick_replies" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "quick_replies" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- Cria índice na coluna categoryId
CREATE INDEX IF NOT EXISTS "quick_replies_categoryId_idx" ON "quick_replies"("categoryId");

-- Adiciona foreign key
ALTER TABLE "quick_replies" 
ADD CONSTRAINT "quick_replies_categoryId_fkey" 
FOREIGN KEY ("categoryId") REFERENCES "quick_reply_categories"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Insere algumas categorias padrão
INSERT INTO "quick_reply_categories" ("id", "name", "description", "color", "order", "updatedAt")
VALUES 
  ('cat_saudacao', 'Saudações', 'Mensagens de boas-vindas e saudações', '#10B981', 1, CURRENT_TIMESTAMP),
  ('cat_info', 'Informações', 'Informações sobre produtos e serviços', '#3B82F6', 2, CURRENT_TIMESTAMP),
  ('cat_preco', 'Preços', 'Respostas sobre valores e condições', '#F59E0B', 3, CURRENT_TIMESTAMP),
  ('cat_suporte', 'Suporte', 'Mensagens de suporte e ajuda', '#EF4444', 4, CURRENT_TIMESTAMP),
  ('cat_encerramento', 'Encerramento', 'Mensagens de despedida e finalização', '#8B5CF6', 5, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insere algumas respostas rápidas de exemplo
INSERT INTO "quick_replies" ("id", "name", "content", "shortcut", "categoryId", "variables", "order", "active", "updatedAt")
VALUES 
  ('qr_ola', 'Olá, bom dia!', 'Olá! 👋 Bom dia! Seja bem-vindo(a) ao nosso atendimento. Como posso ajudar você hoje?', '/bomdia', 'cat_saudacao', '[]', 1, true, CURRENT_TIMESTAMP),
  ('qr_boatarde', 'Boa tarde!', 'Olá! 👋 Boa tarde! Como posso ajudar você?', '/boatarde', 'cat_saudacao', '[]', 2, true, CURRENT_TIMESTAMP),
  ('qr_noite', 'Boa noite!', 'Olá! 👋 Boa noite! Como posso ajudar você?', '/boanoite', 'cat_saudacao', '[]', 3, true, CURRENT_TIMESTAMP),
  ('qr_aguarde', 'Aguarde um momento', 'Por favor, aguarde um momento enquanto verifico as informações para você. 🔍', '/aguarde', 'cat_suporte', '[]', 1, true, CURRENT_TIMESTAMP),
  ('qr_agradeco', 'Agradecimento', 'Muito obrigado pelo contato! 🙏 Estamos à disposição para qualquer dúvida.', '/obrigado', 'cat_encerramento', '[]', 1, true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
