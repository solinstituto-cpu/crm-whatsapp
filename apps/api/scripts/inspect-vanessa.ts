import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectVanessa() {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        name: {
          contains: 'Vanessa',
          mode: 'insensitive',
        },
      },
      include: {
        conversations: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            whatsappAccountId: true,
          },
        },
      },
    });

    console.log(`[INFO] Encontrados ${contacts.length} contatos com 'Vanessa':`);
    for (const c of contacts) {
      console.log(`--------------------------------------------------`);
      console.log(`ID: ${c.id}`);
      console.log(`Nome: "${c.name}"`);
      console.log(`Telefone: ${c.phoneE164}`);
      console.log(`Tags (raw): ${JSON.stringify(c.tags)} (tipo: ${typeof c.tags})`);
      console.log(`CustomerStatus: ${c.customerStatus}`);
      console.log(`Conversas (${c.conversations.length}):`);
      c.conversations.forEach(conv => {
        console.log(`  - Conv ID: ${conv.id} | Status: ${conv.status} | Criada em: ${conv.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Erro ao buscar Vanessa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectVanessa();
