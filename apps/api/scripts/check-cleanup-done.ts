import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const countRemaining = await prisma.message.count({
    where: {
      body: { contains: 'yoga_agosto_2026' }
    }
  });

  console.log(`Mensagens restantes com "yoga_agosto_2026": ${countRemaining}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
