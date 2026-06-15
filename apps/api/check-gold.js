const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Buscar contatos que tem tags contendo "gold" (case insensitive)
  const contacts = await prisma.contact.findMany({
    where: { tags: { contains: 'old', mode: 'insensitive' } },
    select: { name: true, tags: true },
    take: 10
  });
  console.log('Contatos com tag gold/Golden:', contacts.length);
  contacts.forEach(c => console.log(`- ${c.name}: ${c.tags}`));
}
main().finally(() => prisma.$disconnect());
