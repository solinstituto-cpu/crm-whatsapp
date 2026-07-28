import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date('2026-07-20T00:00:00-03:00');
  
  // Find messages created today
  const messages = await prisma.message.findMany({
    where: {
      createdAt: {
        gte: today,
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      conversation: {
        include: {
          contact: true
        }
      }
    }
  });
  
  console.log(`--- MESSAGES CREATED TODAY (Total: ${messages.length}) ---`);
  for (const m of messages.slice(0, 30)) {
    console.log(`Time: ${m.createdAt}`);
    console.log(`Contact: ${m.conversation?.contact?.name} (${m.conversation?.phoneE164})`);
    console.log(`Direction: ${m.direction} | Type: ${m.type}`);
    console.log(`Body: ${m.body?.substring(0, 60)}`);
    console.log(`UnreadCount: ${m.conversation?.unreadCount}`);
    console.log(`Tags: ${m.conversation?.contact?.tags}`);
    console.log('--------------------');
  }

  // Find campaigns updated or created today
  const campaigns = await prisma.campaign.findMany({
    where: {
      updatedAt: {
        gte: today
      }
    }
  });
  console.log(`\n--- CAMPAIGNS UPDATED TODAY (Total: ${campaigns.length}) ---`);
  for (const c of campaigns) {
    console.log(`ID: ${c.id} | Name: ${c.name} | Status: ${c.status} | UpdatedAt: ${c.updatedAt}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
