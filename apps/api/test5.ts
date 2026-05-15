import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({
    where: {
      contact: { name: { in: ['Jurema', 'Marcia Regina Siqueira', 'Fernando', 'Dolores'] } }
    },
    include: { contact: true }
  });

  convs.forEach(c => {
    console.log(c.contact?.name || 'Sem contato', c.contact?.tags);
  });
}

main().finally(() => prisma.$disconnect());
