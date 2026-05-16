import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  await prisma.flowSession.updateMany({ 
    where: { status: 'ACTIVE' },
    data: { status: 'COMPLETED' }
  });
  console.log('? Todas as sessões foram finalizadas.');
  await prisma.$disconnect();
}

run();
