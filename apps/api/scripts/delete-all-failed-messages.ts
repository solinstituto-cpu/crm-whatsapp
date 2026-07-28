import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== EXECUÇÃO DA EXCLUSÃO DE TODAS AS MENSAGENS COM STATUS FAILED ===');

  // 1. Identificar conversas afetadas antes de apagar
  const affectedConvs = await prisma.conversation.findMany({
    where: {
      messages: {
        some: { status: 'FAILED' }
      }
    },
    select: { id: true }
  });

  const convIds = affectedConvs.map(c => c.id);
  console.log(`Encontradas ${convIds.length} conversas com mensagens com falha (FAILED).`);

  // 2. Deletar todas as mensagens com status FAILED
  const deleteResult = await prisma.message.deleteMany({
    where: {
      status: 'FAILED'
    }
  });

  console.log(`✅ Foram deletadas com sucesso ${deleteResult.count} mensagens com status FAILED.`);

  // 3. Atualizar lastMessageAt e lastIncomingMessageAt de todas as conversas afetadas
  let updatedCount = 0;
  for (const convId of convIds) {
    const lastMsg = await prisma.message.findFirst({
      where: { conversationId: convId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    const lastIncoming = await prisma.message.findFirst({
      where: { conversationId: convId, direction: 'IN' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: {
        lastMessageAt: lastMsg?.createdAt || null,
        lastIncomingMessageAt: lastIncoming?.createdAt || null,
      }
    });
    updatedCount++;
  }

  console.log(`✅ ${updatedCount} conversas foram atualizadas com o estado correto.`);
  console.log('=== EXCLUSÃO DE MENSAGENS COM FALHA CONCLUÍDA ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
