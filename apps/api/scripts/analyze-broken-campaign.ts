import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check campaigns with template yoga_agosto_2026 or created recently
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('=== RECENT CAMPAIGNS ===');
  for (const c of campaigns) {
    const msgCount = await prisma.campaignMessage.count({ where: { campaignId: c.id } });
    console.log(`ID: ${c.id} | Name: "${c.name}" | Template: "${c.templateName}" | Status: ${c.status} | Messages: ${msgCount} | CreatedAt: ${c.createdAt.toISOString()}`);
  }

  // Count messages in Message table containing yoga_agosto_2026
  const msgWithYogaTemplate = await prisma.message.count({
    where: {
      body: { contains: 'yoga_agosto_2026' }
    }
  });

  console.log(`\nTotal messages in Message table with body containing "yoga_agosto_2026": ${msgWithYogaTemplate}`);

  // Find conversations that have these messages
  const convsWithYogaTemplate = await prisma.conversation.findMany({
    where: {
      messages: {
        some: {
          body: { contains: 'yoga_agosto_2026' }
        }
      }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      },
      contact: true
    }
  });

  console.log(`Total conversations with "yoga_agosto_2026" messages: ${convsWithYogaTemplate.length}`);

  let onlyYogaTemplate = 0;
  let hasClientResponse = 0;
  let hasOtherOutMessages = 0;

  for (const conv of convsWithYogaTemplate) {
    const hasIn = conv.messages.some(m => m.direction === 'IN');
    const nonYogaOut = conv.messages.filter(m => m.direction === 'OUT' && !m.body?.includes('yoga_agosto_2026'));
    
    if (hasIn) {
      hasClientResponse++;
    } else if (nonYogaOut.length > 0) {
      hasOtherOutMessages++;
    } else {
      onlyYogaTemplate++;
    }
  }

  console.log(`Conversations with ONLY "yoga_agosto_2026" messages (no client response, no other outgoing): ${onlyYogaTemplate}`);
  console.log(`Conversations with client response: ${hasClientResponse}`);
  console.log(`Conversations with other outgoing messages (but no client response): ${hasOtherOutMessages}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
