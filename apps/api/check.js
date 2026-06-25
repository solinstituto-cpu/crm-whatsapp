const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  .then(campaigns => {
    campaigns.forEach(c => {
      console.log(`Campaign: ${c.name} (${c.id})`);
      console.log(`Account ID: ${c.whatsappAccountId}`);
      console.log(`Status: ${c.status}`);
      console.log(`Created At: ${c.createdAt}`);
      console.log('---');
    });
  })
  .finally(() => p.$disconnect());
