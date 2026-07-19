const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badContacts = await prisma.contact.findMany();

  const filtered = badContacts.filter(c => c.phoneE164 && c.phoneE164.length > 15);
  console.log(`=== CONTATOS COM NUMEROS MUITO LONGOS (${filtered.length}) ===`);
  
  // Group by suffix/length or print a few
  filtered.slice(0, 30).forEach((c, i) => {
    console.log(`[${i+1}] ${c.name} | ${c.phoneE164} | Criado em: ${c.createdAt} | Origem: ${c.source}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
