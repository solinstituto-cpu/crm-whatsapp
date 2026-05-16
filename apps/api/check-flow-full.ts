import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  // Verificar o flow
  const flow = await prisma.flow.findFirst({ 
    where: { name: 'Atendimento de Cursos Inteligente (IA)' },
    include: { nodes: { orderBy: { position: 'asc' } } }
  });
  if (!flow) { console.log('FLOW NAO ENCONTRADO!'); await prisma.$disconnect(); return; }
  console.log('Flow:', flow.name, '| Status:', flow.status, '| Trigger:', flow.trigger, '| Active:', flow.isActive);
  
  // Sessoes ativas recentes
  const sessions = await prisma.flowSession.findMany({ 
    where: { flowId: flow.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('\nUltimas sessoes:');
  sessions.forEach(s => console.log(' -', s.contactId, '| Status:', s.status, '| CreatedAt:', s.createdAt));
  
  await prisma.$disconnect();
}
run();
