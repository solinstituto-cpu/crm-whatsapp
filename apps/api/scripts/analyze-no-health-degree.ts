/**
 * ANÁLISE: Contatos de acupuntura que disseram NÃO ter formação na área da saúde
 * Gera um arquivo CSV com nome, telefone, e as mensagens que deram match
 *
 * Uso: npx tsx scripts/analyze-no-health-degree.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Padrões que indicam que o contato NÃO tem formação na saúde
const NO_HEALTH_DEGREE_PATTERNS = [
  'não tenho formação', 'nao tenho formacao',
  'não tenho graduação', 'nao tenho graduacao',
  'não sou formado', 'nao sou formado',
  'não sou formada', 'nao sou formada',
  'não sou da área da saúde', 'nao sou da area da saude',
  'não sou da saúde', 'nao sou da saude',
  'não tenho curso na área', 'nao tenho curso na area',
  'não tenho diploma', 'nao tenho diploma',
  'sem formação na saúde', 'sem formacao na saude',
  'sem formação na área', 'sem formacao na area',
  'sem graduação', 'sem graduacao',
  'sou leigo', 'sou leiga',
  'não sou profissional da saúde', 'nao sou profissional da saude',
  'não sou profissional de saúde', 'nao sou profissional de saude',
  'não fiz faculdade', 'nao fiz faculdade',
  'não tenho faculdade', 'nao tenho faculdade',
  'não tenho superior', 'nao tenho superior',
  'não tenho ensino superior', 'nao tenho ensino superior',
  'só tenho ensino médio', 'so tenho ensino medio',
  'tenho só o ensino médio', 'tenho so o ensino medio',
  'não atuo na saúde', 'nao atuo na saude',
  'não trabalho na saúde', 'nao trabalho na saude',
  'não sou enfermeiro', 'nao sou enfermeiro',
  'não sou enfermeira', 'nao sou enfermeira',
  'não sou médico', 'nao sou medico',
  'não sou médica', 'nao sou medica',
  'não sou fisioterapeuta', 'nao sou fisioterapeuta',
  'não sou farmacêutico', 'nao sou farmaceutico',
  'não sou farmacêutica', 'nao sou farmaceutica',
  'precisa ter formação', 'precisa ter formacao',
  'precisa ser formado', 'precisa ser da saúde',
  'precisa ser da saude', 'precisa de graduação',
  'precisa de graduacao', 'preciso ter formação',
  'preciso ter formacao', 'preciso ser formado',
  'preciso ser da área', 'preciso ser da area',
  'exige formação', 'exige formacao',
  'exige graduação', 'exige graduacao',
  'necessário ter formação', 'necessario ter formacao',
  'qualquer pessoa pode', 'qualquer um pode fazer',
  'não precisa ser da saúde', 'não precisa de formação',
  'n tenho formação', 'n sou formado', 'n sou da saude',
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function main() {
  console.log('🔍 Buscando contatos de acupuntura...');

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { interest: { contains: 'acupuntura', mode: 'insensitive' } },
        { tags: { contains: 'acupuntura', mode: 'insensitive' } },
        { notes: { contains: 'acupuntura', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      phoneE164: true,
      email: true,
      interest: true,
      customerStatus: true,
      tags: true,
      conversations: {
        select: {
          messages: {
            where: { direction: 'IN' },
            select: { body: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  console.log(`📋 Total de contatos de acupuntura: ${contacts.length}`);

  const results: any[] = [];

  for (const contact of contacts) {
    const matchedMessages: string[] = [];
    const matchedPatterns = new Set<string>();

    for (const conv of contact.conversations) {
      for (const msg of conv.messages) {
        if (!msg.body) continue;
        const bodyNorm = normalize(msg.body);

        for (const pattern of NO_HEALTH_DEGREE_PATTERNS) {
          const patternNorm = normalize(pattern);
          if (bodyNorm.includes(patternNorm)) {
            matchedMessages.push(msg.body.substring(0, 200).replace(/\n/g, ' '));
            matchedPatterns.add(pattern);
            break;
          }
        }
      }
    }

    if (matchedMessages.length > 0) {
      let tags: string[] = [];
      try { tags = JSON.parse(contact.tags || '[]'); } catch {}

      results.push({
        nome: contact.name,
        telefone: contact.phoneE164,
        email: contact.email || '',
        interesse: contact.interest || '',
        status: contact.customerStatus || '',
        tags: tags.join('; '),
        padroes_encontrados: [...matchedPatterns].join(' | '),
        total_mensagens_match: matchedMessages.length,
        mensagem_exemplo: matchedMessages[0] || '',
      });
    }
  }

  // Ordenar por total de matches
  results.sort((a, b) => b.total_mensagens_match - a.total_mensagens_match);

  console.log(`\n✅ ${results.length} contatos identificados sem formação na área da saúde de ${contacts.length} analisados`);
  console.log(`📊 Percentual: ${((results.length / contacts.length) * 100).toFixed(1)}%\n`);

  if (results.length === 0) {
    console.log('⚠️  Nenhum contato encontrado com os padrões definidos.');
    console.log('Dica: As conversas podem não ter sido indexadas ou os textos podem estar em formatos diferentes.');
    await prisma.$disconnect();
    return;
  }

  // Gerar CSV
  const csvHeader = Object.keys(results[0]).join(',');
  const csvRows = results.map(r =>
    Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  const csv = [csvHeader, ...csvRows].join('\n');

  const outputPath = path.join(__dirname, `../listas_analise/acupuntura_sem_formacao_saude_${new Date().toISOString().slice(0, 10)}.csv`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, '\uFEFF' + csv, 'utf8'); // BOM para Excel

  console.log(`💾 CSV gerado: ${outputPath}`);
  console.log(`\n📋 Primeiros 10 contatos:`);
  results.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ${r.nome} (${r.telefone}) - "${r.mensagem_exemplo.substring(0, 80)}..."`);
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
  process.exit(1);
});
