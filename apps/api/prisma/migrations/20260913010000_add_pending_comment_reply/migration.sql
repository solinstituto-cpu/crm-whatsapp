-- Suporte a "comentário vira lead": quando alguém comenta em um post do
-- Facebook/Instagram, criamos uma conversa/lead no CRM e a primeira resposta
-- do atendente precisa ser enviada como "resposta privada" da Meta
-- (POST /{page-id}/messages com recipient.comment_id), não como mensagem
-- normal. Guardamos aqui qual comentário está pendente dessa resposta, e
-- quando ele chegou (a Meta só permite responder dentro de 7 dias).

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "pendingCommentId" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "pendingCommentAt" TIMESTAMP(3);
