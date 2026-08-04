import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.campaign.updateMany({
    where: { status: 'RUNNING' },
    data: { status: 'PAUSED' }
  });
  console.log(`⏸️ Pausadas ${result.count} campanhas que estavam em execução.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
