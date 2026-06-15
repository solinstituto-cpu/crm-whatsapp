const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const totalOpen = await prisma.conversation.count({ where: { status: 'OPEN' } });
  const totalArchived = await prisma.conversation.count({ where: { status: 'ARCHIVED' } });
  const totalClosed = await prisma.conversation.count({ where: { status: 'CLOSED' } });
  
  const sampleOpen = await prisma.conversation.findMany({
    where: { status: 'OPEN' },
    take: 10,
    orderBy: { lastMessageAt: 'desc' },
    include: { contact: { select: { name: true, tags: true } } }
  });
  
  console.log('=== CONVERSAS ===');
  console.log('OPEN:', totalOpen);
  console.log('ARCHIVED:', totalArchived);
  console.log('CLOSED:', totalClosed);
  console.log('\n=== 10 OPEN MAIS RECENTES ===');
  sampleOpen.forEach(c => {
    console.log(`- ${c.contact?.name || 'Sem nome'} | tags: "${c.contact?.tags || 'NULL'}"`);
  });
}
main().finally(() => prisma.$disconnect());
