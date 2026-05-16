async function run() {
  try {
    const res = await fetch('https://sol-crm-eight.vercel.app/api/reports/dashboard');
    const data = await res.json();
    console.log('agentSlaStats length from Vercel:', data.agentSlaStats ? data.agentSlaStats.length : 'undefined');
    console.log('summary unread:', data.summary ? data.summary.unreadConversations : 'undefined');
  } catch (e) {
    console.error(e.message);
  }
}
run();
