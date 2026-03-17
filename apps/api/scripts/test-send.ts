import axios from 'axios';
import * as readline from 'readline';

/*
  Script rápido: faz login com admin@crm.com / admin123 e envia mensagem de teste via /api/wa/send.
  Uso: npm run test:send -- --to +55SEUNUMERO --text "Mensagem"
  Se não passar --to, ele pergunta.
*/

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string,string> = {};
  for (let i=0;i<args.length;i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i+1] && !args[i+1].startsWith('--') ? args[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

async function prompt(question: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>(res => rl.question(question, ans => { rl.close(); res(ans); }));
}

async function main() {
  const base = process.env.API_BASE || 'http://localhost:4000/api';
  const args = parseArgs();
  let to = args.to;
  let text = args.text || 'Teste via script';

  if (!to) to = await prompt('Número destino (E.164 ex +5511999999999): ');

  console.log('🔐 Login...');
  const loginRes = await axios.post(`${base}/auth/login`, { email: 'admin@crm.com', password: 'admin123' })
    .catch(e => { throw new Error('Falha login: '+ (e.response?.data?.message || e.message)); });

  const token = loginRes.data.access_token;
  console.log('✅ Login OK');

  console.log('📤 Enviando mensagem...');
  const sendRes = await axios.post(`${base}/wa/send`, { to, type: 'text', text }, {
    headers: { Authorization: `Bearer ${token}` }
  }).catch(e => {
    const data = e.response?.data;
    console.error('❌ Erro envio', data || e.message);
    process.exit(1);
  });

  console.log('✅ Enviado:', sendRes?.data);
}

main().catch(err => { console.error(err); process.exit(1); });
