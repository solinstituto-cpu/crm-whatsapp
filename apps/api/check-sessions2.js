const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const sessions = await p.flowSession.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Sessoes recentes:');
  sessions.forEach(s => console.log(' -', s.contactId, '|', s.status, '|', s.createdAt));
  
  const flow = await p.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  console.log('\nFlow isActive:', flow ? flow.isActive : 'NAO ENCONTRADO');
  console.log('Flow trigger:', flow ? flow.trigger : '?');
  
  await p.$disconnect();
}
run().catch(console.error);
