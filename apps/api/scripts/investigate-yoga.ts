import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaignId = 'cmrotmdc005dj7mle0qxvuf54'; // Yoga 17-07-26
  
  // Find campaign messages
  const messages = await prisma.campaignMessage.findMany({
    where: { campaignId },
    take: 15,
  });
  
  console.log(`Campaign messages sent count: ${messages.length}`);
  
  // For each contact, find their conversation
  for (const msg of messages) {
    const contact = await prisma.contact.findUnique({
      where: { id: msg.contactId }
    });
    
    const conversation = await prisma.conversation.findFirst({
      where: { contactId: msg.contactId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 2
        }
      }
    });
    
    console.log(`Contact: ${contact?.name} (${contact?.phoneE164})`);
    console.log(`  Tags: ${contact?.tags}`);
    console.log(`  Conversation ID: ${conversation?.id}`);
    console.log(`  Conversation Status: ${conversation?.status}`);
    console.log(`  Conversation unreadCount: ${conversation?.unreadCount}`);
    console.log(`  Conversation lastIncomingMessageAt: ${conversation?.lastIncomingMessageAt}`);
    console.log(`  Conversation updatedAt: ${conversation?.updatedAt}`);
    console.log(`  Messages count: ${conversation?.messages.length || 0}`);
    if (conversation?.messages) {
      for (const m of conversation.messages) {
        console.log(`    Message [${m.direction}]: ${m.body?.substring(0, 50)} (${m.createdAt})`);
      }
    }
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
