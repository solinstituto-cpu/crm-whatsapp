import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const flow = await prisma.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  if (flow) {
    const nodes = await prisma.flowNode.findMany({ where: { flowId: flow.id }, orderBy: { position: 'asc' } });
    console.log(JSON.stringify(nodes.map(n => ({ id: n.id, type: n.type, position: n.position, nextNodeId: n.nextNodeId })), null, 2));
  }
  await prisma.$disconnect();
}
run();
