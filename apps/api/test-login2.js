const axios = require('axios');

async function testLogin() {
  const apiUrl = 'https://crm-api-laxv.onrender.com';

  // Test with correct password
  try {
    const res = await axios.post(`${apiUrl}/api/auth/login`, {
      email: 'admin@crm.com',
      password: 'Cgp03070@'
    });
    console.log('Login SUCCESS:', res.status);
    console.log('User:', res.data.user);
    console.log('Token:', res.data.access_token ? 'YES' : 'NO');
  } catch(e) {
    console.log('Login FAILED:', e.response?.status, e.response?.data || e.message);
  }
}

testLogin();
