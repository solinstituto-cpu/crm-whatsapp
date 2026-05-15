import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const rogerio = users.find(u => u.name.toLowerCase().includes('rogerio') || u.email.toLowerCase().includes('rogerio'));
  
  if (!rogerio) {
    console.log('Rogerio not found');
    return;
  }
  
  console.log('Rogerio ID:', rogerio.id);
  
  const rogerioOpen = await prisma.conversation.count({ where: { status: 'OPEN', assignedToId: rogerio.id } });
  console.log('Rogerio OPEN:', rogerioOpen);
  
  const rogerioNoTags = await prisma.conversation.count({ 
    where: { 
      status: 'OPEN', 
      assignedToId: rogerio.id,
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
    } 
  });
  console.log('Rogerio OPEN No Tags:', rogerioNoTags);
  
  const rogerioTags = await prisma.conversation.count({
    where: {
      status: 'OPEN',
      assignedToId: rogerio.id,
      contact: {
        AND: [
          { tags: { not: '[]' } },
          { tags: { not: '' } },
          { tags: { not: '["Golden"]' } }
        ]
      }
    }
  });
  console.log('Rogerio OPEN With Tags:', rogerioTags);
}

main().finally(() => prisma.$disconnect());
