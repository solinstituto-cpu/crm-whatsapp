import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    include: {
      whatsappAccount: {
        select: { name: true }
      }
    }
  });

  console.log('--- ALL CAMPAIGNS ---');
  for (const c of campaigns) {
    console.log(`ID: ${c.id}`);
    console.log(`Name: ${c.name}`);
    console.log(`Status: ${c.status}`);
    console.log(`Account ID: ${c.whatsappAccountId} (${c.whatsappAccount?.name || 'none'})`);
    console.log(`Created At: ${c.createdAt}`);
    console.log('--------------------');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
