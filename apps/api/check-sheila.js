const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const contact = await prisma.contact.findFirst({
    where: { phoneE164: '+5511987876053' },
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
    const conv = contact.conversations[contact.conversations.length - 1];
    if (conv) {
      conv.messages.forEach(m => {
        console.log(`[${m.direction}] ${m.type} | JSON: ${m.json}`);
        console.log(`BODY: ${m.body}`);
        console.log('---');
      });
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
