import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar a mensagem template da campanha "Holistica 27/06" que foi entregue
  const msg = await prisma.message.findFirst({
    where: { 
      type: 'template',
      status: { in: ['SENT', 'DELIVERED', 'READ', 'delivered', 'read'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  if (msg) {
    console.log('=== MENSAGEM TEMPLATE MAIS RECENTE ===');
    console.log('Type:', msg.type);
    console.log('Body:', msg.body?.substring(0, 100) + '...');
    console.log('JSON:', msg.json);
    console.log('Status:', msg.status);
  }

  // Buscar últimas 3 mensagens template
  const msgs = await prisma.message.findMany({
    where: { type: 'template' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  console.log('\n=== ÚLTIMAS 3 MENSAGENS TEMPLATE ===');
  for (const m of msgs) {
    console.log(`\nID: ${m.id}`);
    console.log(`Status: ${m.status}`);
    console.log(`JSON: ${m.json}`);
    console.log('---');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
