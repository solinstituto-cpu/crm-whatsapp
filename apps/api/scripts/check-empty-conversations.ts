import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalConversations = await prisma.conversation.count();

  // Conversations with 0 messages
  const emptyConversations = await prisma.conversation.findMany({
    where: {
      messages: {
        none: {}
      }
    },
    select: {
      id: true,
      phoneE164: true,
      contact: { select: { name: true } }
    }
  });

  const nonEmptyCount = totalConversations - emptyConversations.length;

  console.log(`=== VERIFICAÇÃO DE CONVERSAS VAZIAS ===`);
  console.log(`Total de conversas no sistema: ${totalConversations}`);
  console.log(`Conversas SEM NENHUMA mensagem (vazias): ${emptyConversations.length}`);
  console.log(`Conversas COM mensagens (histórico ativo): ${nonEmptyCount}`);

  if (emptyConversations.length > 0) {
    console.log('\nAmostra de 5 conversas vazias:');
    for (const c of emptyConversations.slice(0, 5)) {
      console.log(`Conv ID: ${c.id} | Contato: ${c.contact?.name || 'Sem nome'} (${c.phoneE164})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
