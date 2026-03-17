-- Adicionar campos de dados pessoais
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "state" TEXT;

-- Adicionar campos comerciais
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "interest" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "customerStatus" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "enrollmentDate" TIMESTAMP;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;
