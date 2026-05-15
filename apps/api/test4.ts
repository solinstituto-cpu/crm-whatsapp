import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rogerioId = 'cmkukxcik00009dcyj8scjhpr';
  
  const where: any = {};
  where.assignedToId = rogerioId;
  // Intentionally omitting status to simulate my removed status
  // where.status = 'OPEN';
  
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
  
  console.log('Query where:', JSON.stringify(where, null, 2));

  try {
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        take: 10,
        include: {
          contact: true,
          assignedTo: {
            select: { id: true, name: true, email: true, color: true },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [
          { unreadCount: 'desc' },
          { lastMessageAt: 'desc' },
        ],
      }),
      prisma.conversation.count({ where }),
    ]);
    console.log('Result total:', total);
    console.log('Result count returned:', conversations.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().finally(() => prisma.$disconnect());
