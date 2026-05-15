const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function run() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    console.log('USERS IN DB:');
    console.table(users);
    
    // Check if admin@crm.com exists
    const admin = await prisma.user.findUnique({ where: { email: 'admin@crm.com' } });
    if (!admin) {
      console.log('Creating admin@crm.com...');
      const hashedPassword = await bcrypt.hash('Cgp03070@', 10);
      await prisma.user.create({
        data: {
          email: 'admin@crm.com',
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('Admin user created successfully.');
    } else {
      console.log('Updating password for admin@crm.com...');
      const hashedPassword = await bcrypt.hash('Cgp03070@', 10);
      await prisma.user.update({
        where: { email: 'admin@crm.com' },
        data: { password: hashedPassword }
      });
      console.log('Password updated successfully.');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
