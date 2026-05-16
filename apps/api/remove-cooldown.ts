import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const flow = await prisma.flow.findFirst({
    where: { name: 'Atendimento de Cursos Inteligente (IA)' }
  });

  if (flow) {
    await prisma.flow.update({
      where: { id: flow.id },
      data: {
        triggerConfig: JSON.stringify({ cooldownHours: 0 }) 
      }
    });
    console.log('? Cooldown removido!');
  }
  await prisma.$disconnect();
}

run();
