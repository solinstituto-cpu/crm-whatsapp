import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const failedMessages = await prisma.campaignMessage.findMany({
    where: {
      status: 'FAILED',
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 5,
    include: {
      campaign: true,
    },
  });

  console.log('--- FAILED CAMPAIGN MESSAGES ---');
  for (const msg of failedMessages) {
    console.log(`Campaign: ${msg.campaign.name} (${msg.campaignId})`);
    console.log(`Contact: ${msg.contactPhone} (${msg.contactName})`);
    console.log(`Error: ${msg.error}`);
    console.log(`WhatsApp Account ID on Campaign: ${msg.campaign.whatsappAccountId}`);
    console.log('--------------------------------');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
