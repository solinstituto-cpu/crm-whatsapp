import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const conversations = await prisma.conversation.findMany({
    where: {
      messages: {
        some: {
          body: { contains: 'yoga_agosto_2026' }
        }
      }
    },
    include: {
      messages: true,
      contact: true
    }
  });

  let withIncoming = 0;
  let withoutIncoming = 0;
  let totalYogaMsgs = 0;

  for (const conv of conversations) {
    const hasIn = conv.messages.some(m => m.direction === 'IN');
    const yogaMsgs = conv.messages.filter(m => m.body?.includes('yoga_agosto_2026'));
    totalYogaMsgs += yogaMsgs.length;

    if (hasIn) {
      withIncoming++;
    } else {
      withoutIncoming++;
    }
  }

  console.log(`=== RESUMO DA CAMPANHA YOGA (yoga_agosto_2026) ===`);
  console.log(`Total de conversas afetadas: ${conversations.length}`);
  console.log(`Total de mensagens com o template incorreto (imagens repetidas): ${totalYogaMsgs}`);
  console.log(`Conversas SEM NENHUMA resposta do cliente: ${withoutIncoming}`);
  console.log(`Conversas COM resposta/interação do cliente: ${withIncoming}`);

  // List contacts with incoming responses to review
  console.log('\n--- Contatos com resposta do cliente: ---');
  for (const conv of conversations.filter(c => c.messages.some(m => m.direction === 'IN'))) {
    console.log(`Contato: ${conv.contact?.name || conv.phoneE164} (${conv.phoneE164}) | Conv ID: ${conv.id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
