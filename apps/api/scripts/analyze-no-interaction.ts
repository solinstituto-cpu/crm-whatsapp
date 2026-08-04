import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeConversations() {
  try {
    const targetDate = new Date('2026-07-05T23:59:59.999Z');

    // Buscar conversas criadas até 05/07/2026
    const conversations = await prisma.conversation.findMany({
      where: {
        createdAt: {
          lte: targetDate,
        },
      },
      include: {
        messages: {
          select: {
            id: true,
            direction: true,
            createdAt: true,
            type: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
          },
        },
      },
    });

    let countNoClientInteraction = 0;
    let countOnlyOutbound = 0;
    let countZeroMessages = 0;

    for (const conv of conversations) {
      // Verificar se o cliente enviou alguma mensagem (direction == 'IN')
      const hasClientMessage = conv.messages.some(m => m.direction === 'IN');

      if (!hasClientMessage) {
        countNoClientInteraction++;
        if (conv.messages.length === 0) {
          countZeroMessages++;
        } else {
          countOnlyOutbound++;
        }
      }
    }

    console.log(`--------------------------------------------------`);
    console.log(`📊 RESULTADO DA ANÁLISE DE CONVERSAS (Até 05/07/2026):`);
    console.log(`--------------------------------------------------`);
    console.log(`- Total de conversas no banco criadas até 05/07/2026: ${conversations.length}`);
    console.log(`- Conversas SEM NENHUMA RESPOSTA/INTERAÇÃO do cliente: ${countNoClientInteraction}`);
    console.log(`  └─ Conversas com mensagens enviadas sem resposta (apenas OUT): ${countOnlyOutbound}`);
    console.log(`  └─ Conversas sem nenhuma mensagem registrada: ${countZeroMessages}`);
    console.log(`--------------------------------------------------`);

  } catch (error) {
    console.error('Erro ao analisar conversas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeConversations();
