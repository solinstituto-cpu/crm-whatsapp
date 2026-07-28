import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Mapeamento de termos para tags de campanha/origem
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

  console.log(`Analisando contatos criados até ${cutoffDate.toISOString()} por Tags de Origem e Mensagens do Cliente...`);

  const contacts = await prisma.contact.findMany({
    where: {
      optedOut: false,
      createdAt: {
        lte: cutoffDate
      }
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
    if (!phone) continue;

    const tagsText = (contact.tags || '').toLowerCase();
    const incomingMessages = contact.conversations
      .flatMap(c => c.messages)
      .map(m => m.body || '')
      .join(' ')
      .toLowerCase();
    const interestField = (contact.interest || '').toLowerCase();

    // Texto combinado apenas de ORIGEM (tags/interesse) + MENSAGEM ENVIADA PELO CLIENTE (ignorando disparos automáticos)
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

  console.log('\n--- RESUMO CORRIGIDO BASEADO EM TAGS DE ORIGEM DO LEAD + RESPOSTAS DO CLIENTE ---');
  for (const [cat, map] of Object.entries(results)) {
    console.log(`${cat}: ${map.size} contatos únicos`);
  }

  const outputDir = path.join(process.cwd(), 'listas_whatsapp_mes06');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [cat, map] of Object.entries(results)) {
    const list = Array.from(map.values());
    let csvContent = 'Nome,Telefone,TagsOrigem,DataCadastro,CriterioClassificacao\n';
    csvContent += list.map(item => `"${item.name.replace(/"/g, '""')}","${item.phone}","${item.origin.replace(/"/g, '""')}","${item.date}","${item.matchedBy.replace(/"/g, '""')}"`).join('\n');

    const filePath = path.join(outputDir, `lista_${cat.toLowerCase()}_ate_mes06.csv`);
    fs.writeFileSync(filePath, csvContent, 'utf-8');
    console.log(`Arquivo recriado: ${filePath}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
