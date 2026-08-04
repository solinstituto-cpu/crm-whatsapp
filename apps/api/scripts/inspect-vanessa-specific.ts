import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectVanessaAluna() {
  try {
    // Buscar por nome "Vanessa" que tenha "(aluna)" ou similar
    const contacts = await prisma.contact.findMany({
      where: {
        name: {
          contains: 'Vanessa',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        phoneE164: true,
        tags: true,
      },
    });

    // Filtrar as que têm "aluna" no nome
    const alunas = contacts.filter(c => c.name && c.name.toLowerCase().includes('aluna'));
    console.log(`\n--- VANESSA COM "ALUNA" NO NOME ---`);
    for (const c of alunas) {
      console.log(`Nome: "${c.name}" | Phone: ${c.phoneE164} | Tags: ${JSON.stringify(c.tags)} (tipo: ${typeof c.tags})`);
    }

    // Também buscar conversas OPEN cujo contato é "Vanessa" com conversa na aba reengaja (com tags)
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'OPEN',
        contact: {
          name: {
            contains: 'Vanessa',
            mode: 'insensitive',
          },
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`\n--- TODAS CONVERSAS ABERTAS DE "VANESSA" ---`);
    for (const conv of conversations) {
      const c = conv.contact;
      console.log(`Conv ID: ${conv.id} | Nome: "${c?.name}" | Phone: ${c?.phoneE164} | Tags: ${JSON.stringify(c?.tags)} (tipo: ${typeof c?.tags}) | Status: ${conv.status}`);
    }

    // Buscar por números similares ao do screenshot (5535991753XX)
    const byPhone = await prisma.contact.findMany({
      where: {
        phoneE164: {
          contains: '5535',
        },
        name: {
          contains: 'Vanessa',
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true, phoneE164: true, tags: true },
    });

    console.log(`\n--- VANESSA COM DDD 35 ---`);
    for (const c of byPhone) {
      console.log(`Nome: "${c.name}" | Phone: ${c.phoneE164} | Tags: ${JSON.stringify(c.tags)}`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectVanessaAluna();
