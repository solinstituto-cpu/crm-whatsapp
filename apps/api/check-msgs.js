const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msgs = await prisma.message.findMany({
    where: { 
      conversation: {
        OR: [
          { phoneE164: '+5511997335755' },
          { phoneE164: '+5511997332037' }
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, body: true, direction: true, createdAt: true, conversation: { select: { phoneE164: true } } }
  });
  console.log('Mensagens Rogerio/Fernando:');
  msgs.forEach(m => console.log(' -', m.direction, '|', m.conversation?.phoneE164, '|', m.body?.substring(0, 40), '|', m.createdAt));
  await prisma.$disconnect();
}
run().catch(console.error);
