import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ULTIMAS 50 MENSAGENS DA CAMPANHA MASSOTERAPIA ===');
  const campaign = await prisma.campaign.findFirst({
    where: { name: { contains: 'Massoterapia parte 01 28/07' } },
  });

  if (!campaign) return;

  const messages = await prisma.campaignMessage.findMany({
    where: { campaignId: campaign.id },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });

  for (const m of messages) {
    console.log(`id=${m.id} phone=${m.contactPhone} status=${m.status} waId=${m.waMessageId ? sTrunc(m.waMessageId) : 'null'} updatedAt=${m.updatedAt.toISOString()} error=${m.error}`);
  }

  // Check chat Message table for this campaign's contacts
  const chatMessages = await prisma.message.findMany({
    where: {
      direction: 'OUT',
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      conversation: { select: { phoneE164: true } }
    }
  });

  console.log('\n=== ULTIMAS MENSAGENS NO CHAT (última 1 hora) ===');
  for (const cm of chatMessages) {
    console.log(`chatMsgId=${cm.id} phone=${cm.conversation?.phoneE164} createdAt=${cm.createdAt.toISOString()} body=${cm.body?.slice(0, 40)}`);
  }
}

function sTrunc(str: string) {
  return str.slice(0, 25) + '...';
}

main().catch(console.error).finally(() => prisma.$disconnect());
