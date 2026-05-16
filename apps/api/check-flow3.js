const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const flows = await prisma.flow.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 });
  flows.forEach(f => console.log('Flow:', f.name, '| isActive:', f.isActive, '| trigger:', f.trigger, '| cooldownHours:', f.cooldownHours));
  
  const sessions = await prisma.flowSession.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('\nSessoes recentes:');
  sessions.forEach(s => console.log(' -', s.contactId, '| status:', s.status, '| created:', s.createdAt));
  
  await prisma.$disconnect();
}
run().catch(console.error);
