const axios = require('axios');

async function run() {
  const apiUrl = 'https://crm-drm.onrender.com';
  
  console.log('Logging in...');
  let token = '';
  let userId = '';
  try {
    const res = await axios.post(`${apiUrl}/api/auth/login`, {
      email: 'admin@crm.com',
      password: 'Cgp03070@'
    });
    token = res.data.access_token;
    userId = res.data.user?.id;
    console.log('Logged in successfully! Token obtained. User ID:', userId);
  } catch (e) {
    console.error('Login failed:', e.response?.status, e.response?.data || e.message);
    return;
  }

  // 1. Test Fetch WhatsApp Accounts
  try {
    console.log('\nFetching WhatsApp Accounts with userId...');
    const res = await axios.get(`${apiUrl}/api/whatsapp-accounts?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Accounts Response Status:', res.status);
    console.log('Accounts length:', res.data.length);
    console.log('Accounts data:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Failed to fetch accounts:', e.response?.status, e.response?.data || e.message);
  }

  // 2. Test Fetch Templates
  try {
    console.log('\nFetching Templates...');
    const res = await axios.get(`${apiUrl}/api/templates?status=APPROVED`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Templates Response Status:', res.status);
    console.log('Templates count:', res.data.length);
  } catch (e) {
    console.error('Failed to fetch templates:', e.response?.status, e.response?.data || e.message);
  }
}

run();
