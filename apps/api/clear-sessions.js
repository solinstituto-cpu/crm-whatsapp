const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  // Deletar todas as sessoes COMPLETED para zerar o cooldown
  const deleted = await p.flowSession.deleteMany({
    where: { status: 'COMPLETED' }
  });
  console.log('Sessoes COMPLETED deletadas:', deleted.count);
  
  // Confirmar que nao ha sessoes ativas
  const active = await p.flowSession.count({ where: { status: 'ACTIVE' } });
  console.log('Sessoes ACTIVE restantes:', active);
  
  // Confirmar flow ativo
  const flow = await p.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  console.log('Flow isActive:', flow?.isActive, '| triggerConfig:', flow?.triggerConfig);
  
  await p.$disconnect();
}
run().catch(console.error);
