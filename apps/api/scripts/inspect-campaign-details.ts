import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: 'cmrotmdc005dj7mle0qxvuf54' },
    include: {
      messages: true
    }
  });

  if (!campaign) {
    console.log('Campaign not found');
    return;
  }

  console.log(`Campaign: ${campaign.name} (${campaign.id})`);
  console.log(`Total campaign messages: ${campaign.messages.length}`);
  console.log(`Campaign template: ${campaign.templateName}`);

  // Get all contact IDs in campaign messages
  const contactIds = campaign.messages.map(m => m.contactId);

  // Find conversations for these contacts
  const conversations = await prisma.conversation.findMany({
    where: {
      contactId: { in: contactIds }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      },
      contact: true
    }
  });

  console.log(`Total conversations found for campaign contacts: ${conversations.length}`);

  let conversationsWithIncoming = 0;
  let conversationsOnlyCampaign = 0;
  let conversationsMultipleCampaignMsgs = 0;

  for (const conv of conversations) {
    const hasIncoming = conv.messages.some(m => m.direction === 'IN');
    const outMessages = conv.messages.filter(m => m.direction === 'OUT');
    if (hasIncoming) {
      conversationsWithIncoming++;
    } else {
      conversationsOnlyCampaign++;
    }
    if (outMessages.length > 1) {
      conversationsMultipleCampaignMsgs++;
    }
  }

  console.log(`Conversations with client replies (IN): ${conversationsWithIncoming}`);
  console.log(`Conversations with ONLY outgoing messages: ${conversationsOnlyCampaign}`);
  console.log(`Conversations with multiple outgoing messages: ${conversationsMultipleCampaignMsgs}`);

  console.log('\nSample 5 conversations:');
  for (const conv of conversations.slice(0, 5)) {
    console.log(`Conv ID: ${conv.id} | Contact: ${conv.contact?.name} (${conv.phoneE164})`);
    console.log(`  Msg count: ${conv.messages.length}`);
    for (const m of conv.messages) {
      console.log(`  - [${m.direction}] (${m.type}) ${m.createdAt.toISOString()} : ${m.body?.substring(0, 50)}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
