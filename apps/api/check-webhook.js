const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const settings = await prisma.whatsAppSettings.findFirst();
    console.log('WhatsApp Settings:', JSON.stringify(settings, null, 2));
  } catch(e) {
    console.log('Erro settings:', e.message);
  }
  
  // Check recent messages to see if webhook is receiving
  const msgs = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, body: true, direction: true, createdAt: true, conversation: { select: { phoneE164: true } } }
  });
  console.log('\nUltimas mensagens recebidas:');
  msgs.forEach(m => console.log(' -', m.direction, '|', m.conversation?.phoneE164, '|', m.body?.substring(0, 30), '|', m.createdAt));
  
  await prisma.$disconnect();
}
run().catch(console.error);
