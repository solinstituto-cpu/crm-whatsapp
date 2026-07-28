import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== EXECUÇÃO DA LIMPEZA DE MENSAGENS INCORRETAS DE YOGA ===');

  // 1. Identificar conversas que possuem mensagens da campanha
  const conversationsToUpdate = await prisma.conversation.findMany({
    where: {
      messages: {
        some: {
          body: { contains: 'yoga_agosto_2026' }
        }
      }
    },
    select: { id: true }
  });

  const convIds = conversationsToUpdate.map(c => c.id);
  console.log(`Encontradas ${convIds.length} conversas com mensagens da campanha.`);

  // 2. Deletar todas as mensagens do template yoga_agosto_2026
  const deleteResult = await prisma.message.deleteMany({
    where: {
      body: { contains: 'yoga_agosto_2026' }
    }
  });

  console.log(`✅ Foram deletadas com sucesso ${deleteResult.count} mensagens incorretas.`);

  // 3. Atualizar o lastMessageAt de todas as conversas afetadas
  let updatedConvs = 0;
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
    updatedConvs++;
  }

  console.log(`✅ ${updatedConvs} conversas foram atualizadas (lastMessageAt/lastIncomingMessageAt alinhados).`);
  console.log('=== LIMPEZA CONCLUÍDA COM SUCESSO ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
