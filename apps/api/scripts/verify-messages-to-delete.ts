import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check sample messages with yoga_agosto_2026
  const sampleMessages = await prisma.message.findMany({
    where: {
      body: { contains: 'yoga_agosto_2026' }
    },
    take: 5
  });

  console.log('--- SAMPLE MESSAGES TO BE DELETED ---');
  for (const m of sampleMessages) {
    console.log(`ID: ${m.id} | ConvID: ${m.conversationId} | Type: ${m.type} | Direction: ${m.direction} | Body: "${m.body}"`);
  }

  const countToDelete = await prisma.message.count({
    where: {
      body: { contains: 'yoga_agosto_2026' }
    }
  });

  console.log(`\nTotal count to delete: ${countToDelete}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
