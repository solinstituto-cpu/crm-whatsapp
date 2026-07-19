const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany();
  console.log('=== TEMPLATES NO BANCO ===');
  for (const t of templates) {
    console.log(`ID: ${t.id}`);
    console.log(`Nome: ${t.name}`);
    console.log(`Categoria: ${t.category}`);
    console.log(`Status: ${t.status}`);
    console.log('---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
