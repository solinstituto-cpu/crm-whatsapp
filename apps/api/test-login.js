const axios = require('axios');

async function testLogin() {
  const apiUrl = 'https://crm-api-laxv.onrender.com';
  
  // Test 1: API health
  try {
    const health = await axios.get(`${apiUrl}/api/wa/debug`);
    console.log('API Health:', health.data.ok ? 'OK' : 'FAIL', health.data);
  } catch(e) {
    console.log('API Health error:', e.response?.status, e.response?.data || e.message);
  }

  // Test 2: Login with admin
  try {
    const res = await axios.post(`${apiUrl}/api/auth/login`, {
      email: 'admin@crm.com',
      password: 'admin123'
    });
    console.log('Admin login:', res.status, res.data);
  } catch(e) {
    console.log('Admin login FAILED:', e.response?.status, e.response?.data || e.message);
  }

  // Test 3: Login with deni
  try {
    const res = await axios.post(`${apiUrl}/api/auth/login`, {
      email: 'deni.morais777@gmail.com',
      password: 'deni123'
    });
    console.log('Deni login:', res.status, res.data);
  } catch(e) {
    console.log('Deni login FAILED:', e.response?.status, e.response?.data || e.message);
  }

  // Test 4: List users from DB
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
    console.log('Users in DB:', users);
  } catch(e) {
    console.log('DB query error:', e.message);
  }
  await prisma.$disconnect();
}

testLogin();
