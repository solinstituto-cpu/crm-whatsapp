import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TAG_RULES: Record<string, string[]> = {
  YOGA: ['yoga'],
  MEDITACAO: ['medita', 'meditacao', 'meditação'],
  MASSOTERAPIA: ['massoterap', 'massagem', 'massoterapeuta', 'reflexologia', 'drenagem', 'shiatshu', 'quick', 'nat'],
  ACUPUNTURA: ['acupuntura', 'acupunt', 'acup', 'acp'],
  TERAPIAS_HOLISTICAS: ['holistic', 'holística', 'holistica', 'reiki', 'terapia', 'terapeuta', 'barra', 'constelacao', 'astrologia', 'florais', 'aromaterapia']
};

function formatPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (!clean) return '';
  if (!clean.startsWith('55') && clean.length <= 11) {
    clean = '55' + clean;
  }
  return clean;
}

// Extrair todos os telefones e nomes da planilha baixada do Google Sheets
function extractMatriculadosFromCsv(csvPath: string): { phoneSet: Set<string>; nameSet: Set<string> } {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const phoneSet = new Set<string>();
  const nameSet = new Set<string>();

  for (const line of lines) {
    // Buscar telefones usando regex (números com ou sem 55, ddd e número)
    const matches = line.match(/(?:55\d{10,11}|\b\d{10,11}\b)/g);
    if (matches) {
      for (const m of matches) {
        const formatted = formatPhone(m);
        if (formatted.length >= 12) {
          phoneSet.add(formatted);
        }
      }
    }

    // Extração das colunas por split simples de CSV
    const cols = line.split(',');
    if (cols.length > 2) {
      const nameCandidate = cols[2]?.replace(/"/g, '').trim().toLowerCase();
      if (nameCandidate && nameCandidate.length > 3 && !nameCandidate.includes('acupuntura') && !nameCandidate.includes('turmas') && !nameCandidate.includes('ano')) {
        nameSet.add(nameCandidate);
      }
    }
  }

  return { phoneSet, nameSet };
}

async function main() {
  const cutoffDate = new Date('2026-06-30T23:59:59.999Z');
  const threeMonthsAgo = new Date('2026-04-27T00:00:00.000Z');

  const csvPath = path.join(process.cwd(), 'planilhas_matriculados.csv');
  const { phoneSet: matriculadosPhones, nameSet: matriculadosNames } = extractMatriculadosFromCsv(csvPath);

  console.log(`Planilha de Matriculados analisada: ${matriculadosPhones.size} telefones únicos extraídos da planilha.`);

  // 1. Identificar contatos com envios nos últimos 3 meses
  const recentCampaignMessages = await prisma.campaignMessage.findMany({
    where: {
      sentAt: { gte: threeMonthsAgo },
      status: { in: ['SENT', 'DELIVERED', 'READ', 'PENDING'] }
    },
    select: { contactId: true, contactPhone: true }
  });

  const recentOutMessages = await prisma.message.findMany({
    where: {
      direction: 'OUT',
      createdAt: { gte: threeMonthsAgo }
    },
    select: {
      conversation: { select: { contactId: true, phoneE164: true } }
    }
  });

  const excludedPhoneSet = new Set<string>();
  const excludedContactIdSet = new Set<string>();

  recentCampaignMessages.forEach(msg => {
    if (msg.contactId) excludedContactIdSet.add(msg.contactId);
    if (msg.contactPhone) excludedPhoneSet.add(formatPhone(msg.contactPhone));
  });

  recentOutMessages.forEach(m => {
    if (m.conversation?.contactId) excludedContactIdSet.add(m.conversation.contactId);
    if (m.conversation?.phoneE164) excludedPhoneSet.add(formatPhone(m.conversation.phoneE164));
  });

  // 2. Buscar contatos elegíveis no CRM criados até 30/06
  const contacts = await prisma.contact.findMany({
    where: {
      optedOut: false,
      createdAt: { lte: cutoffDate },
      id: { notIn: Array.from(excludedContactIdSet) }
    },
    include: {
      conversations: {
        include: {
          messages: {
            where: { direction: 'IN' },
            orderBy: { createdAt: 'asc' },
            take: 5
          }
        }
      }
    }
  });

  const results: Record<string, Map<string, { name: string; phone: string; origin: string; date: string; matchedBy: string }>> = {
    Yoga: new Map(),
    Meditacao: new Map(),
    Massoterapia: new Map(),
    Acupuntura: new Map(),
    Terapias_Holisticas: new Map(),
    Outros_Sem_Classificacao: new Map()
  };

  let totalMatriculadosRemovidos = 0;

  for (const contact of contacts) {
    const phone = formatPhone(contact.phoneE164);
    if (!phone || excludedPhoneSet.has(phone)) continue;

    // VERIFICAR SE O CLIENTE JÁ ESTÁ MATRICULADO (POR TELEFONE OU NOME NA PLANILHA GOOGLE)
    const isMatriculadoByPhone = matriculadosPhones.has(phone);
    const isMatriculadoByName = contact.name ? matriculadosNames.has(contact.name.trim().toLowerCase()) : false;

    if (isMatriculadoByPhone || isMatriculadoByName) {
      totalMatriculadosRemovidos++;
      continue; // Pula o contato matriculado
    }

    const tagsText = (contact.tags || '').toLowerCase();
    const incomingMessages = contact.conversations
      .flatMap(c => c.messages)
      .map(m => m.body || '')
      .join(' ')
      .toLowerCase();
    const interestField = (contact.interest || '').toLowerCase();

    const combinedContent = `${tagsText} ${interestField} ${incomingMessages}`;

    let matched = false;

    for (const [catName, keywords] of Object.entries(TAG_RULES)) {
      const hasMatch = keywords.some(kw => combinedContent.includes(kw));
      if (hasMatch) {
        let keyName = catName;
        if (catName === 'YOGA') keyName = 'Yoga';
        if (catName === 'MEDITACAO') keyName = 'Meditacao';
        if (catName === 'MASSOTERAPIA') keyName = 'Massoterapia';
        if (catName === 'ACUPUNTURA') keyName = 'Acupuntura';
        if (catName === 'TERAPIAS_HOLISTICAS') keyName = 'Terapias_Holisticas';

        if (!results[keyName].has(phone)) {
          results[keyName].set(phone, {
            name: contact.name || 'Sem Nome',
            phone: phone,
            origin: contact.tags || contact.source || 'Sistema',
            date: contact.createdAt.toISOString().split('T')[0],
            matchedBy: tagsText.length > 2 ? contact.tags : incomingMessages.substring(0, 80)
          });
        }
        matched = true;
      }
    }

    if (!matched) {
      if (!results.Outros_Sem_Classificacao.has(phone)) {
        results.Outros_Sem_Classificacao.set(phone, {
          name: contact.name || 'Sem Nome',
          phone: phone,
          origin: contact.tags || contact.source || 'Sistema',
          date: contact.createdAt.toISOString().split('T')[0],
          matchedBy: 'Sem palavra-chave correspondente'
        });
      }
    }
  }

  console.log(`\nClientes matriculados removidos com sucesso: ${totalMatriculadosRemovidos}`);
  console.log('\n--- RESUMO FINAL: SEM CAMPANHAS NOS ÚLTIMOS 3 MESES E SEM MATRICULADOS ---');
  for (const [cat, map] of Object.entries(results)) {
    console.log(`${cat}: ${map.size} contatos únicos`);
  }

  // NOVA PASTA EXCLUSIVA PARA LISTAS LIMPAS SEM MATRICULADOS
  const outputDir = path.join(process.cwd(), 'listas_whatsapp_sem_matriculados');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [cat, map] of Object.entries(results)) {
    const list = Array.from(map.values());
    let csvContent = 'Nome,Telefone,TagsOrigem,DataCadastro,CriterioClassificacao\n';
    csvContent += list.map(item => `"${item.name.replace(/"/g, '""')}","${item.phone}","${item.origin.replace(/"/g, '""')}","${item.date}","${item.matchedBy.replace(/"/g, '""')}"`).join('\n');

    const filePath = path.join(outputDir, `lista_${cat.toLowerCase()}_sem_matriculados.csv`);
    fs.writeFileSync(filePath, csvContent, 'utf-8');
    console.log(`Nova lista limpa salva: ${filePath}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
