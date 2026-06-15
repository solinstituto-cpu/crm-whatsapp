/**
 * Script de diagnóstico para verificar a distribuição de contatos por conta WhatsApp.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Diagnóstico de contatos por conta WhatsApp\n');

  // Buscar todas as contas
  const accounts = await prisma.whatsAppAccount.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total de contas WhatsApp: ${accounts.length}\n`);

  for (const account of accounts) {
    const count = await prisma.contact.count({
      where: { whatsappAccountId: account.id },
    });
    console.log(`  📱 ${account.name} (${account.phoneNumber}) [${account.isDefault ? 'PADRÃO' : ''}] - ID: ${account.id}`);
    console.log(`     Contatos: ${count}`);
  }

  // Contatos sem conta
  const nullCount = await prisma.contact.count({
    where: { whatsappAccountId: null },
  });
  console.log(`\n  ❓ Contatos sem conta: ${nullCount}`);

  // Total geral
  const totalContacts = await prisma.contact.count();
  console.log(`\n📊 Total geral de contatos: ${totalContacts}`);

  // Mostrar alguns contatos para verificar
  const sampleContacts = await prisma.contact.findMany({
    take: 5,
    select: { id: true, name: true, phoneE164: true, whatsappAccountId: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('\n📋 Últimos 5 contatos:');
  for (const c of sampleContacts) {
    const accName = accounts.find(a => a.id === c.whatsappAccountId)?.name || 'SEM CONTA';
    console.log(`  ${c.name} (${c.phoneE164}) -> ${accName}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
