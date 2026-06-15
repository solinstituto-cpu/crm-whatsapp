/**
 * Script para migrar contatos existentes (sem whatsappAccountId)
 * para a conta padrão (isDefault=true) ou a primeira conta disponível.
 * 
 * Uso: node fix-contacts-account.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Migrando contatos sem whatsappAccountId para a conta padrão...\n');

  // 1. Buscar a conta padrão
  const defaultAccount = await prisma.whatsAppAccount.findFirst({
    where: { isDefault: true },
  });

  if (!defaultAccount) {
    const firstAccount = await prisma.whatsAppAccount.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!firstAccount) {
      console.log('❌ Nenhuma conta WhatsApp encontrada. Nada a fazer.');
      return;
    }
    console.log(`⚠️ Nenhuma conta padrão encontrada. Usando primeira conta: ${firstAccount.name} (${firstAccount.phoneNumber})`);
    await migrateContacts(firstAccount);
  } else {
    console.log(`✅ Conta padrão encontrada: ${defaultAccount.name} (${defaultAccount.phoneNumber})`);
    await migrateContacts(defaultAccount);
  }
}

async function migrateContacts(account) {
  // 2. Contar contatos sem whatsappAccountId
  const orphanCount = await prisma.contact.count({
    where: { whatsappAccountId: null },
  });

  console.log(`📊 Contatos sem conta associada: ${orphanCount}`);

  if (orphanCount === 0) {
    console.log('✅ Todos os contatos já estão associados a uma conta. Nada a fazer.');
    return;
  }

  // 3. Buscar todos os contatos sem conta
  const orphanContacts = await prisma.contact.findMany({
    where: { whatsappAccountId: null },
    select: { id: true, name: true, phoneE164: true },
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const contact of orphanContacts) {
    try {
      // Verificar se já existe um contato com esse telefone na conta destino
      const existing = await prisma.contact.findFirst({
        where: {
          phoneE164: contact.phoneE164,
          whatsappAccountId: account.id,
        },
      });

      if (existing) {
        console.log(`  ⏭️ Pulando ${contact.name} (${contact.phoneE164}) - já existe na conta ${account.name}`);
        skipped++;
        continue;
      }

      await prisma.contact.update({
        where: { id: contact.id },
        data: { whatsappAccountId: account.id },
      });
      updated++;
      console.log(`  ✅ ${contact.name} (${contact.phoneE164}) -> ${account.name}`);
    } catch (error) {
      errors++;
      console.log(`  ❌ Erro ao migrar ${contact.name} (${contact.phoneE164}): ${error.message}`);
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`  ✅ Atualizados: ${updated}`);
  console.log(`  ⏭️ Pulados (já existiam): ${skipped}`);
  console.log(`  ❌ Erros: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
