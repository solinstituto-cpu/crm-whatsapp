import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const where: any = {};
  where.status = 'OPEN';

  // This is what conversations.service.ts does:
  if (!where.contact) where.contact = {};

  const noTagsCondition = {
    OR: [
      { contactId: null },
      {
        contact: {
          OR: [
            { tags: '[]' },
            { tags: '' },
            { tags: '["Golden"]' }
          ]
        }
      }
    ]
  };

  where.OR = noTagsCondition.OR;

  const convs = await prisma.conversation.findMany({
    where,
    include: { contact: true }
  });

  console.log(`Matched ${convs.length} conversations`);
  convs.forEach(c => {
    console.log(c.contact?.name, c.contact?.tags);
  });
}

main().finally(() => prisma.$disconnect());
