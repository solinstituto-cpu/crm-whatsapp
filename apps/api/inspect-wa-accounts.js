const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.whatsAppAccount.findMany();
  console.log('=== CONTAS WHATSAPP ===');
  for (const a of accounts) {
    console.log(`ID: ${a.id}`);
    console.log(`Nome: ${a.name}`);
    console.log(`phoneNumber: ${a.phoneNumber}`);
    console.log(`phoneNumberId: ${a.phoneNumberId}`);
    console.log(`businessId: ${a.businessId}`);
    console.log('---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
