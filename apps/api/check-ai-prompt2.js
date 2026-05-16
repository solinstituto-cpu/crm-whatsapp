const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const flow = await p.flow.findFirst({ 
    where: { name: 'Atendimento de Cursos Inteligente (IA)' },
    include: { nodes: { orderBy: { position: 'asc' } } }
  });
  
  flow.nodes.forEach(n => {
    console.log('\n=== Node:', n.name, '| Type:', n.type, '===');
    console.log('Config RAW:', n.config);
  });
  
  // Também checar a base de conhecimento
  const kb = await p.knowledgeBase.findFirst();
  if (kb) {
    console.log('\n=== Knowledge Base ===');
    console.log('Name:', kb.name);
    console.log('SystemPrompt:', kb.systemPrompt);
  }
  
  await p.$disconnect();
}
run().catch(console.error);
