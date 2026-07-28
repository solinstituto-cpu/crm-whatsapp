import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== EXECUÇÃO DA LIMPEZA DE CONVERSAS VAZIAS POR ID ===');

  const emptyConversations = await prisma.conversation.findMany({
    where: {
      messages: {
        none: {}
      }
    },
    select: { id: true }
  });

  const ids = emptyConversations.map(c => c.id);
  console.log(`Encontradas ${ids.length} conversas vazias para deletar.`);

  if (ids.length > 0) {
    const deleteResult = await prisma.conversation.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    console.log(`✅ Foram deletadas com sucesso ${deleteResult.count} conversas vazias da Caixa de Entrada.`);
  }

  console.log('ℹ️ Todos os contatos continuam salvos normalmente na tabela Contact.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
