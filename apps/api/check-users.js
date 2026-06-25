const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const mappings = await p.userWhatsAppAccount.findMany({
    include: {
      user: true,
      account: true
    }
  });

  console.log("=== USER WHATSAPP ACCOUNT MAPPINGS ===");
  mappings.forEach(m => {
    console.log(`User: ${m.user.name} (${m.user.email}) -> Account: ${m.account.name} (ID: ${m.accountId})`);
  });

  const allAccounts = await p.whatsAppAccount.findMany();
  console.log("=== ALL WHATSAPP ACCOUNTS ===");
  allAccounts.forEach(a => {
    console.log(`Account: ${a.name} (ID: ${a.id})`);
  });

  const allUsers = await p.user.findMany();
  console.log("=== ALL USERS ===");
  allUsers.forEach(u => {
    console.log(`User: ${u.name} (${u.email}) - Role: ${u.role}`);
  });
}

main().catch(console.error).finally(() => p.$disconnect());
