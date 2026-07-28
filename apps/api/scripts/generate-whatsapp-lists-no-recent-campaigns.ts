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
  if (!clean.startsWith('55') && clean.length <= 11) {
    clean = '55' + clean;
  }
  return clean;
}

async function main() {
  const cutoffDate = new Date('2026-06-30T23:59:59.999Z');
  // 3 meses atrás a partir de hoje (27/07/2026) -> 27/04/2026
  const threeMonthsAgo = new Date('2026-04-27T00:00:00.000Z');

  console.log(`Buscando contatos criados até 30/06 que NÃO receberam campanha nos últimos 3 meses (desde ${threeMonthsAgo.toISOString().split('T')[0]})...`);

  // 1. Identificar contatos/telefones que receberam mensagens de campanha nos últimos 3 meses
  const recentCampaignMessages = await prisma.campaignMessage.findMany({
    where: {
      sentAt: { gte: threeMonthsAgo },
      status: { in: ['SENT', 'DELIVERED', 'READ', 'PENDING'] }
    },
    select: { contactId: true, contactPhone: true }
  });

  const excludedPhoneSet = new Set<string>();
  const excludedContactIdSet = new Set<string>();

  recentCampaignMessages.forEach(msg => {
    if (msg.contactId) excludedContactIdSet.add(msg.contactId);
    if (msg.contactPhone) excludedPhoneSet.add(formatPhone(msg.contactPhone));
  });

  // Também verificar se há mensagens de saída (OUT) enviadas via conversa direta nos últimos 3 meses decorrentes de disparo
  const recentOutMessages = await prisma.message.findMany({
    where: {
      direction: 'OUT',
      createdAt: { gte: threeMonthsAgo }
    },
    select: {
      conversation: { select: { contactId: true, phoneE164: true } }
    }
  });

  recentOutMessages.forEach(m => {
    if (m.conversation?.contactId) excludedContactIdSet.add(m.conversation.contactId);
    if (m.conversation?.phoneE164) excludedPhoneSet.add(formatPhone(m.conversation.phoneE164));
  });

  console.log(`Total de telefones excluídos por terem recebido mensagens nos últimos 3 meses: ${excludedPhoneSet.size}`);

  // 2. Buscar contatos elegíveis criados até 30/06
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

  for (const contact of contacts) {
    const phone = formatPhone(contact.phoneE164);
    if (!phone || excludedPhoneSet.has(phone)) continue;

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

  console.log('\n--- RESUMO: SEM CAMPANHAS NOS ÚLTIMOS 3 MESES ---');
  for (const [cat, map] of Object.entries(results)) {
    console.log(`${cat}: ${map.size} contatos únicos`);
  }

  // NOVA PASTA SEM SOBREPOR A ANTERIOR
  const outputDir = path.join(process.cwd(), 'listas_whatsapp_sem_campanha_3meses');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [cat, map] of Object.entries(results)) {
    const list = Array.from(map.values());
    let csvContent = 'Nome,Telefone,TagsOrigem,DataCadastro,CriterioClassificacao\n';
    csvContent += list.map(item => `"${item.name.replace(/"/g, '""')}","${item.phone}","${item.origin.replace(/"/g, '""')}","${item.date}","${item.matchedBy.replace(/"/g, '""')}"`).join('\n');

    const filePath = path.join(outputDir, `lista_${cat.toLowerCase()}_sem_campanha_3meses.csv`);
    fs.writeFileSync(filePath, csvContent, 'utf-8');
    console.log(`Arquivo salvo em nova pasta: ${filePath}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
