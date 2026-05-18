const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  const nodes = await prisma.flowNode.findMany({ where: { type: 'AI_CHATBOT' } });
  for (let n of nodes) {
    let c = JSON.parse(n.config);
    const rule = '\n9. Se o cliente mencionar qualquer deficiencia fisica, visual, auditiva ou necessidade especial (ex: sou deficiente, uso cadeira de rodas, nao enxergo), responda APENAS: "Vou te transferir agora mesmo para um de nossos consultores que podera te orientar melhor! Um momento" e encerre a conversa.';
    if (c.aiPrompt) {
      c.aiPrompt += rule;
    } else if (c.prompt) {
      c.prompt += rule;
    }
    await prisma.flowNode.update({ where: { id: n.id }, data: { config: JSON.stringify(c) } });
  }
  console.log('Updated ' + nodes.length + ' nodes');
}
update().catch(console.error).finally(() => prisma.$disconnect());
