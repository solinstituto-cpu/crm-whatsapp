/**
 * Verifica quantas conversas existem sem mensagens (fantasmas de campanhas com erro)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando conversas sem mensagens...\n');

  // Conversas totais
  const totalConversations = await prisma.conversation.count();
  
  // Conversas que não tem nenhuma mensagem
  const emptyConversations = await prisma.conversation.findMany({
    where: {
      messages: { none: {} }
    },
    select: {
      id: true,
      phoneE164: true,
      status: true,
      lastMessageAt: true,
      lastIncomingMessageAt: true,
      createdAt: true,
      contact: { select: { name: true, phoneE164: true } },
      whatsappAccount: { select: { name: true, phoneNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Total de conversas: ${totalConversations}`);
  console.log(`🚫 Conversas SEM mensagens (fantasmas): ${emptyConversations.length}`);
  console.log(`📈 Percentual: ${((emptyConversations.length / totalConversations) * 100).toFixed(1)}%\n`);

  if (emptyConversations.length > 0) {
    console.log('📋 Últimas 20 conversas fantasma:');
    emptyConversations.slice(0, 20).forEach((c, i) => {
      console.log(`  ${i+1}. ${c.contact?.name || 'Sem contato'} (${c.phoneE164}) - Status: ${c.status} - Criada: ${c.createdAt.toISOString().slice(0, 10)} - Conta: ${c.whatsappAccount?.name || 'N/A'}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
});
