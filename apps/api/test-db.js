const { PrismaClient } = require('@prisma/client');

async function testConnection(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('SUCCESS: Connected to ' + url);
    await prisma.$disconnect();
    return true;
  } catch (e) {
    console.log('FAILED: ' + url);
    console.log(e.message.split('\n')[0]);
    return false;
  }
}

async function run() {
  const urls = [
    'postgresql://crm_user:9OCLj7xePEY09RHZ5EUMUFUPrUgFxI0z@dpg-d3e1dpvfte5s73f3pk00-a.oregon-postgres.render.com/crm_db_msng',
    'postgresql://crm_user:9OCLj7xePEY09RHZ5EUMUFUPrUgFxI0z@dpg-d3e1dpvfte5s73f3pk00-a.ohio-postgres.render.com/crm_db_msng'
  ];

  for (const url of urls) {
    const success = await testConnection(url);
    if (success) break;
  }
}

run();
