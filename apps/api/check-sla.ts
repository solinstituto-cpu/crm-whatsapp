import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const unreadCount = await prisma.conversation.count({ where: { unreadCount: { gt: 0 } } });
  console.log('Unread Count:', unreadCount);
  
  const openConversationsSLA = await prisma.conversation.findMany({
    where: { unreadCount: { gt: 0 } },
    include: { assignedTo: true },
  });
  console.log('SLA length:', openConversationsSLA.length);
  await prisma.$disconnect();
}
run();
