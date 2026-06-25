import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.whatsAppAccount.findMany();
  console.log('--- REGISTERED WHATSAPP ACCOUNTS ---');
  for (const acc of accounts) {
    console.log(`ID: ${acc.id}`);
    console.log(`Name: ${acc.name}`);
    console.log(`Phone Number: ${acc.phoneNumber}`);
    console.log(`Phone Number ID: ${acc.phoneNumberId}`);
    console.log(`Is Default: ${acc.isDefault}`);
    console.log(`Is Active: ${acc.isActive}`);
    console.log('------------------------------------');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
