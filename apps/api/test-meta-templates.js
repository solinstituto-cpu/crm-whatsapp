const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function run() {
  try {
    const accounts = await prisma.whatsAppAccount.findMany();
    
    for (const acc of accounts) {
      console.log(`\n--- Testing Account: ${acc.name} ---`);
      console.log(`Phone Number ID: ${acc.phoneNumberId}`);
      console.log(`WABA ID (businessId): ${acc.businessId}`);
      
      // Test 1: Fetching templates using businessId (WABA ID)
      try {
        const wabaUrl = `https://graph.facebook.com/v22.0/${acc.businessId}/message_templates`;
        console.log(`Calling URL: ${wabaUrl}`);
        const res = await axios.get(wabaUrl, {
          headers: { Authorization: `Bearer ${acc.accessToken}` }
        });
        console.log(`Success! Fetched ${res.data.data?.length} templates.`);
      } catch (e) {
        console.error(`WABA ID Fetch Failed:`, e.response?.status, JSON.stringify(e.response?.data || e.message));
      }

      // Test 2: Fetching templates using phoneNumberId (just to see if this is what causes the error)
      try {
        const phoneUrl = `https://graph.facebook.com/v22.0/${acc.phoneNumberId}/message_templates`;
        console.log(`Calling URL (Incorrect): ${phoneUrl}`);
        await axios.get(phoneUrl, {
          headers: { Authorization: `Bearer ${acc.accessToken}` }
        });
      } catch (e) {
        console.error(`Phone Number ID Fetch Failed (Expected):`, e.response?.status, JSON.stringify(e.response?.data || e.message));
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
