import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const flow = await prisma.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' }, include: { nodes: true } });
  console.log(JSON.stringify(flow?.nodes, null, 2));
  await prisma.$disconnect();
}

run();
