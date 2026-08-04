import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteNoInteractionConversations() {
  try {
    const targetDate = new Date('2026-07-05T23:59:59.999Z');

    console.log('🔍 Buscando conversas sem interação anteriores a 05/07/2026...');

    // Buscar conversas criadas até 05/07/2026
    const conversations = await prisma.conversation.findMany({
      where: {
        createdAt: {
          lte: targetDate,
        },
      },
      select: {
        id: true,
        messages: {
          select: {
            id: true,
            direction: true,
          },
        },
      },
    });

    // Filtrar IDs de conversas que NÃO possuem NENHUMA mensagem enviada pelo cliente (direction === 'IN')
    const conversationsToDelete = conversations.filter(conv => {
      return !conv.messages.some(m => m.direction === 'IN');
    });

    const conversationIds = conversationsToDelete.map(c => c.id);

    console.log(`[INFO] Encontradas ${conversationIds.length} conversas para excluir.`);

    if (conversationIds.length === 0) {
      console.log('Nenhuma conversa encontrada para exclusão.');
      return;
    }

    console.log('🗑️ Excluindo mensagens associadas a essas conversas...');
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversationId: {
          in: conversationIds,
        },
      },
    });

    console.log(`✅ ${deletedMessages.count} mensagens excluídas.`);

    console.log('🗑️ Excluindo conversas...');
    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        id: {
          in: conversationIds,
        },
      },
    });

    console.log(`--------------------------------------------------`);
    console.log(`🎉 EXCLUSÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`--------------------------------------------------`);
    console.log(`- Total de conversas excluídas: ${deletedConversations.count}`);
    console.log(`- Total de mensagens associadas excluídas: ${deletedMessages.count}`);
    console.log(`--------------------------------------------------`);

  } catch (error) {
    console.error('Erro ao excluir conversas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteNoInteractionConversations();
