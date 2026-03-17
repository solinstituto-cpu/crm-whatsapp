-- CreateTable
CREATE TABLE "custom_field_options" (
    "id" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_options_fieldType_value_key" ON "custom_field_options"("fieldType", "value");

-- Insert default values
INSERT INTO "custom_field_options" ("id", "fieldType", "value", "label", "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'customerStatus', 'Lead', 'Lead', 1, NOW(), NOW()),
  (gen_random_uuid(), 'customerStatus', 'Interessado', 'Interessado', 2, NOW(), NOW()),
  (gen_random_uuid(), 'customerStatus', 'Negociando', 'Negociando', 3, NOW(), NOW()),
  (gen_random_uuid(), 'customerStatus', 'Cliente', 'Cliente', 4, NOW(), NOW()),
  (gen_random_uuid(), 'customerStatus', 'Ex-cliente', 'Ex-cliente', 5, NOW(), NOW()),
  (gen_random_uuid(), 'customerStatus', 'Inativo', 'Inativo', 6, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Instagram', 'Instagram', 1, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Facebook', 'Facebook', 2, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Google', 'Google', 3, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'WhatsApp', 'WhatsApp', 4, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Indicação', 'Indicação', 5, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Site', 'Site', 6, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Evento', 'Evento', 7, NOW(), NOW()),
  (gen_random_uuid(), 'source', 'Outro', 'Outro', 8, NOW(), NOW());
