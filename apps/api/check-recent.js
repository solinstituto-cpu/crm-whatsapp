const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  // Ver mensagens recebidas nos ultimos 10 minutos
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const msgs = await p.message.findMany({
    where: { createdAt: { gte: since }, direction: 'IN' },
    orderBy: { createdAt: 'desc' },
    select: { body: true, direction: true, createdAt: true, conversation: { select: { phoneE164: true } } }
  });
  console.log('Mensagens IN nos ultimos 10 min:');
  msgs.forEach(m => console.log(' -', m.conversation?.phoneE164, '|', m.body?.substring(0, 40), '|', m.createdAt));
  
  // Ver flow status
  const flow = await p.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  console.log('\nFlow isActive:', flow?.isActive, '| triggerConfig:', flow?.triggerConfig);
  
  // Ver sessoes recentes
  const sessions = await p.flowSession.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } });
  console.log('\nSessoes criadas nos ultimos 10 min:', sessions.length);
  sessions.forEach(s => console.log(' -', s.contactId, '|', s.status));
  
  await p.$disconnect();
}
run().catch(console.error);
