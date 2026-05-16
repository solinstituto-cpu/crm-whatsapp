async function run() {
  const res = await fetch('http://localhost:4000/api/reports/dashboard');
  const data = await res.json();
  console.log('agentSlaStats:', JSON.stringify(data.agentSlaStats));
}
run();
