import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const sessions = await prisma.flowSession.findMany({ 
    where: { contactId: '+5511997335755' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(sessions);
  await prisma.$disconnect();
}

run();
