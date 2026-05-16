const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  // Reativar o flow e zerar o cooldown no triggerConfig
  const flow = await p.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  if (!flow) { console.log('Flow nao encontrado!'); return; }
  
  const config = JSON.parse(flow.triggerConfig || '{}');
  config.cooldownHours = 0; // Sem cooldown
  
  await p.flow.update({
    where: { id: flow.id },
    data: { 
      isActive: true,
      triggerConfig: JSON.stringify(config)
    }
  });
  
  console.log('✅ Flow reativado com cooldown=0');
  console.log('Config:', JSON.stringify(config));
  await p.$disconnect();
}
run().catch(console.error);
