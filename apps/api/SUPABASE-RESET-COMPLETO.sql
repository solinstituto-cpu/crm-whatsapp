-- ============================================
-- PASSO 1: ZERAR O BANCO
-- Execute no Supabase SQL Editor (projeto crm-whats)
-- ATENÇÃO: Apaga TODOS os dados!
-- ============================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ============================================
-- Depois de rodar o acima, execute em uma NOVA query
-- o conteúdo do arquivo: SUPABASE-SCHEMA.sql
-- ============================================
-- Em seguida, execute o: SUPABASE-SEED.sql
