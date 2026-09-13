-- Restaura (de forma aditiva/nao destrutiva) duas colunas legadas que existiam
-- direto no banco de producao mas nunca foram versionadas no schema.prisma.
-- Foram derrubadas em 2026-09-12 por um deploy que usava `prisma db push --accept-data-loss`.
-- Nenhuma tela ou rota do sistema le/escreve esses campos hoje - sao mantidos apenas
-- para preservar o dado e nao quebrar o historico da tabela.

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "channel" TEXT;
