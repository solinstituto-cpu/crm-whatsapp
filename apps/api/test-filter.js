const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    // Campanhas: has tags, but not only gold
    const whereCamp = {
      status: 'OPEN',
      contact: {
        tags: {
          notIn: ['[]', '', '["Golden"]', '["golden"]', '["Gold"]', '["gold"]'],
        }
      }
    };
    const countCamp = await prisma.conversation.count({ where: whereCamp });
    console.log('Campanhas (notIn approach):', countCamp);
    
    // Ativas
    const whereAtivas = {
      status: 'OPEN',
      OR: [
        { contactId: null },
        { contact: { tags: { in: ['[]', ''] } } },
        { contact: { tags: { contains: 'olden', mode: 'insensitive' } } },
      ]
    };
    const countAtivas = await prisma.conversation.count({ where: whereAtivas });
    console.log('Ativas:', countAtivas);
    
    console.log('Total:', countCamp + countAtivas);
    console.log('Expected Total OPEN:', 5419);
    
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
