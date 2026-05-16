import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const flow = await prisma.flow.findFirst({
      where: { name: 'Atendimento de Cursos Inteligente (IA)' }
    });

    if (flow) {
      await prisma.flow.update({
        where: { id: flow.id },
        data: {
          trigger: 'NEW_MESSAGE',
          triggerConfig: JSON.stringify({ cooldownHours: 12 }) // Só dispara 1x a cada 12 horas por pessoa
        }
      });
      console.log('? Gatilho alterado para Todas as Mensagens com sucesso!');
    }
  } catch (error) {
    console.error('? Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
