const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.whatsAppAccount.findMany({
    include: {
      users: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
  console.log('ACCOUNTS AND THEIR ASSIGNED USERS:');
  console.log(JSON.stringify(accounts, null, 2));

  const userAccs = await prisma.userWhatsAppAccount.findMany();
  console.log('USER WHATSAPP ACCOUNTS:');
  console.log(userAccs);
}
main().finally(() => prisma.$disconnect());
