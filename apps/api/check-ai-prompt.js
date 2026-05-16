const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  // Ver o flow e seus nos
  const flow = await p.flow.findFirst({ 
    where: { name: 'Atendimento de Cursos Inteligente (IA)' },
    include: { nodes: { orderBy: { position: 'asc' } } }
  });
  
  flow.nodes.forEach(n => {
    const config = JSON.parse(n.config || '{}');
    console.log('\n=== Node:', n.name, '| Type:', n.type, '===');
    if (config.systemPrompt) console.log('SystemPrompt:', config.systemPrompt);
    if (config.message) console.log('Message:', config.message);
    if (config.knowledgeBaseId) console.log('KnowledgeBaseId:', config.knowledgeBaseId);
    if (config.model) console.log('Model:', config.model);
  });
  
  await p.$disconnect();
}
run().catch(console.error);
