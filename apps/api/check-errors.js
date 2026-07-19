const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const failedMsgs = await prisma.campaignMessage.findMany({
    where: {
      status: 'FAILED',
    },
    select: {
      campaign: {
        select: {
          name: true
        }
      },
      contactName: true,
      contactPhone: true,
      error: true,
      sentAt: true,
    },
    orderBy: { sentAt: 'desc' },
    take: 20,
  });

  console.log(`=== ULTIMOS 20 ERROS DE PUBLICACAO ===`);
  failedMsgs.forEach((msg, i) => {
    console.log(`[${i+1}] Campanha: ${msg.campaign?.name || 'N/A'}`);
    console.log(`    Contato: ${msg.contactName} (${msg.contactPhone})`);
    console.log(`    Erro: ${msg.error}`);
    console.log(`    Data: ${msg.sentAt}`);
    console.log(`---`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
