const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const messages = await p.campaignMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      campaign: true
    }
  });

  console.log(`=== LAST 20 CAMPAIGN MESSAGES ===`);
  messages.forEach(m => {
    console.log(`Campaign: ${m.campaign.name} (${m.campaign.id})`);
    console.log(`Account ID in Campaign: ${m.campaign.whatsappAccountId}`);
    console.log(`Phone: ${m.contactPhone}, Name: ${m.contactName}`);
    console.log(`Status: ${m.status}, Error: ${m.error}`);
    console.log('---');
  });
}

main().catch(console.error).finally(() => p.$disconnect());
