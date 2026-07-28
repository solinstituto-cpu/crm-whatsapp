import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const countFailed = await prisma.message.count({
    where: { status: 'FAILED' }
  });

  console.log(`Mensagens FAILED restantes no banco: ${countFailed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
