import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const nodes = await prisma.flowNode.findMany({ where: { flowId: 'cmp8qny810000tcsew0dnubkx' } });
  
  const aiNode = nodes.find(n => n.type === 'AI_CHATBOT');
  const sendNode = nodes.find(n => n.type === 'SEND_MESSAGE');
  
  if (aiNode && sendNode) {
    // Garantir que Send Message seja a posição 0 e AI Chatbot seja posição 1
    await prisma.flowNode.update({ where: { id: sendNode.id }, data: { position: 0, nextNodeId: aiNode.id } });
    await prisma.flowNode.update({ where: { id: aiNode.id }, data: { position: 1, nextNodeId: null } });
    console.log('? Fluxo conectado com sucesso!');
  }
  
  await prisma.$disconnect();
}

run();
