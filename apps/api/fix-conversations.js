const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Buscando conta padrão do WhatsApp...');
  const defaultAccount = await prisma.whatsAppAccount.findFirst({
    where: { isDefault: true }
  });

  if (!defaultAccount) {
    console.error('❌ Nenhuma conta padrão encontrada. Cadastre uma conta padrão primeiro.');
    return;
  }

  console.log(`✅ Conta padrão encontrada: "${defaultAccount.name}" (ID: ${defaultAccount.id})`);

  const conversationsWithoutAccount = await prisma.conversation.count({
    where: { whatsappAccountId: null }
  });

  console.log(`📋 Encontradas ${conversationsWithoutAccount} conversas sem associação de conta (whatsappAccountId = null).`);

  if (conversationsWithoutAccount > 0) {
    console.log('🔄 Associando conversas sem conta à conta padrão...');
    const result = await prisma.conversation.updateMany({
      where: { whatsappAccountId: null },
      data: { whatsappAccountId: defaultAccount.id }
    });
    console.log(`✅ Sucesso! ${result.count} conversas foram associadas à conta "${defaultAccount.name}".`);
  } else {
    console.log('✨ Nenhuma conversa precisou ser atualizada.');
  }

  // Mesma coisa para campanhas antigas se houver
  const campaignsWithoutAccount = await prisma.campaign.count({
    where: { whatsappAccountId: null }
  });
  console.log(`📋 Encontradas ${campaignsWithoutAccount} campanhas sem associação de conta.`);
  if (campaignsWithoutAccount > 0) {
    console.log('🔄 Associando campanhas sem conta à conta padrão...');
    const result = await prisma.campaign.updateMany({
      where: { whatsappAccountId: null },
      data: { whatsappAccountId: defaultAccount.id }
    });
    console.log(`✅ Sucesso! ${result.count} campanhas foram associadas à conta "${defaultAccount.name}".`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
