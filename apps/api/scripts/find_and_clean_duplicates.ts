import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO CAMPANHAS RECENTES ===');
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });

  for (const c of campaigns) {
    console.log(`Campaign ID: ${c.id} | Name: ${c.name} | Status: ${c.status} | Total Msgs: ${c._count.messages}`);
    
    const messages = await prisma.campaignMessage.findMany({
      where: { campaignId: c.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`  CampaignMessages breakdown: total=${messages.length}`);
    const statusCounts: Record<string, number> = {};
    for (const m of messages) {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    }
    console.log('  Status counts:', statusCounts);
  }

  console.log('\n=== VERIFICANDO MENSAGENS DE CHAT (Message) DUPLICADAS ===');
  const recentMessages = await prisma.message.findMany({
    where: {
      direction: 'OUT',
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { createdAt: 'asc' },
    include: {
      conversation: {
        select: {
          id: true,
          phoneE164: true,
        }
      }
    }
  });

  console.log(`Total de mensagens OUT nos últimos 7 dias: ${recentMessages.length}`);

  const duplicatesToDelete: string[] = [];
  const keptMessages: typeof recentMessages = [];

  for (const msg of recentMessages) {
    const isDuplicate = keptMessages.some(prev => 
      prev.conversationId === msg.conversationId &&
      prev.body === msg.body &&
      Math.abs(msg.createdAt.getTime() - prev.createdAt.getTime()) < 10 * 60 * 1000 // 10 minutos de janela
    );

    if (isDuplicate) {
      duplicatesToDelete.push(msg.id);
      console.log(`  🚨 DUPLICADA ENCONTRADA: id=${msg.id} | convId=${msg.conversationId} | phone=${msg.conversation?.phoneE164} | createdAt=${msg.createdAt.toISOString()} | body=${msg.body?.slice(0, 50)}`);
    } else {
      keptMessages.push(msg);
    }
  }

  console.log(`\nTotal de mensagens de chat duplicadas encontradas para remoção: ${duplicatesToDelete.length}`);

  if (duplicatesToDelete.length > 0) {
    const deleted = await prisma.message.deleteMany({
      where: {
        id: { in: duplicatesToDelete }
      }
    });
    console.log(`✅ Deletadas ${deleted.count} mensagens duplicadas do banco de dados (tabela Message)!`);
  } else {
    console.log('Nenhuma mensagem de chat duplicada precisou ser removida.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
