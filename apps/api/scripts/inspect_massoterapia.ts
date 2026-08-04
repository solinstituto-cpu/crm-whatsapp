import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: { contains: 'Massoterapia parte 01 28/07' } },
    include: {
      messages: true
    }
  });

  if (!campaign) {
    console.log('Campanha não encontrada');
    return;
  }

  console.log(`Campanha: ${campaign.name} (${campaign.id})`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Contadores na tabela Campaign: totalContacts=${campaign.totalContacts}, sentCount=${campaign.sentCount}, deliveredCount=${campaign.deliveredCount}, readCount=${campaign.readCount}, failedCount=${campaign.failedCount}`);

  const statusMap: Record<string, number> = {};
  for (const m of campaign.messages) {
    statusMap[m.status] = (statusMap[m.status] || 0) + 1;
  }

  console.log('Status reais em CampaignMessage:', statusMap);

  // Print sample of messages per status
  for (const [status, count] of Object.entries(statusMap)) {
    console.log(`\nSample status ${status} (${count}):`);
    const sample = campaign.messages.filter(m => m.status === status).slice(0, 3);
    for (const s of sample) {
      console.log(`  id=${s.id} phone=${s.contactPhone} waId=${s.waMessageId} err=${s.error}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
