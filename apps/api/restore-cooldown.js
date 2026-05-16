const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  // Restaurar triggerConfig com cooldown de 24h correto
  const flow = await p.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  if (!flow) { console.log('Flow nao encontrado'); return; }
  
  await p.flow.update({
    where: { id: flow.id },
    data: { 
      isActive: true,
      triggerConfig: JSON.stringify({ cooldownHours: 24 })
    }
  });
  console.log('✅ Flow ativo com cooldown de 24h restaurado');
  await p.$disconnect();
}
run().catch(console.error);
