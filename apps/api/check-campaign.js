const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const contact = await prisma.contact.findFirst({
    where: { phoneE164: '+5511974777849' },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });
  
  if (contact) {
    console.log(`Contact: ${contact.phoneE164}`);
    const conv = contact.conversations[0];
    if (conv) {
      conv.messages.forEach(m => {
        console.log(`[${m.direction}] ${m.type}: ${JSON.stringify(m)}`);
      });
    }
  } else {
    console.log('Contact not found');
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
