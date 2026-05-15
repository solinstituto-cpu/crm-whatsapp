import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.conversation.count();
  console.log('Total Conversations:', count);

  const activeCount = await prisma.conversation.count({ where: { status: 'OPEN' } });
  console.log('Total OPEN:', activeCount);

  const noContact = await prisma.conversation.count({ where: { status: 'OPEN', contactId: null } });
  console.log('OPEN No contact:', noContact);

  const emptyTags = await prisma.conversation.count({ where: { status: 'OPEN', contact: { tags: '[]' } } });
  console.log('OPEN Tags "[]":', emptyTags);

  const goldenTags = await prisma.conversation.count({ where: { status: 'OPEN', contact: { tags: '["Golden"]' } } });
  console.log('OPEN Tags "["Golden"]":', goldenTags);
  
  const anyContact = await prisma.conversation.count({ where: { status: 'OPEN', contact: { isNot: null } } });
  console.log('OPEN with any contact:', anyContact);

  const allContacts = await prisma.contact.findMany({ select: { id: true, tags: true }, take: 10 });
  console.log('Sample tags:', allContacts.map(c => c.tags));
}

main().finally(() => prisma.$disconnect());
