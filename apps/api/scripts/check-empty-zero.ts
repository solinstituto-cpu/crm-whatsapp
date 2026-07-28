import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emptyRemaining = await prisma.conversation.count({
    where: {
      messages: {
        none: {}
      }
    }
  });

  console.log(`Conversas vazias restantes no banco: ${emptyRemaining}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
