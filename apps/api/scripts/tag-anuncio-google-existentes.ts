// Script para renomear tags nas conversas existentes da conta Vendas Sol
// Adiciona "Anuncio Google" aos contatos cuja primeira mensagem IN começa com frases de anúncio
//
// Uso: npx tsx scripts/tag-anuncio-google-existentes.ts

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Wrapper para acessar o modelo WhatsAppAccount corretamente
const WhatsAppAccount = (prisma as any).whatsAppAccount || (prisma as any).WhatsAppAccount;

const ANUNCIO_GOOGLE_PHRASES = [
  'olá! quero garantir',
  'vi voces',
  'vi vcs',
];

async function main() {
  console.log('🏷️  Script de renomeação de tags - Vendas Sol');
  console.log('='.repeat(60));

  // 1. Encontrar a conta Vendas Sol
  const vendasSolAccount = await WhatsAppAccount.findFirst({
    where: {
      name: { contains: 'Vendas Sol', mode: 'insensitive' },
    },
  });

  if (!vendasSolAccount) {
    console.log('❌ Conta "Vendas Sol" não encontrada!');
    return;
  }

  console.log(`✅ Conta encontrada: ${vendasSolAccount.name} (${vendasSolAccount.id})`);

  // 2. Buscar todas as conversas da conta Vendas Sol que estão OPEN
  const conversations = await prisma.conversation.findMany({
    where: {
      whatsappAccountId: vendasSolAccount.id,
      status: 'OPEN',
    },
    include: {
      contact: true,
    },
  });

  console.log(`📋 Total de conversas ativas na Vendas Sol: ${conversations.length}`);

  let taggedAnuncioGoogle = 0;
  let alreadyTagged = 0;
  let ativoCount = 0;
  let novoCount = 0;

  for (const conv of conversations) {
    // Verificar se a conversa foi iniciada pelo atendente (sem lastIncomingMessageAt)
    if (!conv.lastIncomingMessageAt) {
      ativoCount++;
      // "Ativo" é calculado no frontend, não precisa de tag
      continue;
    }

    // Verificar se o contato já tem tag "Anuncio Google"
    let currentTags = [];
    try {
      currentTags = conv.contact?.tags ? JSON.parse(conv.contact.tags) : [];
    } catch { currentTags = []; }

    if (currentTags.includes('Anuncio Google')) {
      alreadyTagged++;
      continue;
    }

    // Buscar a PRIMEIRA mensagem IN da conversa
    const firstInboundMessage = await prisma.message.findFirst({
      where: {
        conversationId: conv.id,
        direction: 'IN',
      },
      orderBy: { createdAt: 'asc' },
      select: { body: true, createdAt: true },
    });

    if (!firstInboundMessage || !firstInboundMessage.body) {
      novoCount++;
      continue;
    }

    // Verificar se começa com frases de anúncio Google
    const bodyLower = firstInboundMessage.body.toLowerCase().trim();
    const isAnuncioGoogle = ANUNCIO_GOOGLE_PHRASES.some(phrase => bodyLower.startsWith(phrase));

    if (isAnuncioGoogle) {
      // Adicionar tag "Anuncio Google"
      if (!currentTags.includes('Anuncio Google')) {
        currentTags.push('Anuncio Google');
      }

      if (conv.contact) {
        await prisma.contact.update({
          where: { id: conv.contact.id },
          data: { tags: JSON.stringify(currentTags) },
        });
        taggedAnuncioGoogle++;
        console.log(`  🟠 Anuncio Google: ${conv.contact.name} (${conv.contact.phoneE164}) — "${firstInboundMessage.body.substring(0, 60)}..."`);
      }
    } else {
      novoCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO:');
  console.log(`  🔵 Ativo (atendente iniciou):     ${ativoCount}`);
  console.log(`  🟠 Anuncio Google (novo):          ${taggedAnuncioGoogle}`);
  console.log(`  🟠 Anuncio Google (já existente):  ${alreadyTagged}`);
  console.log(`  🔴 Novo (cliente iniciou normal):  ${novoCount}`);
  console.log(`  📋 Total processado:               ${conversations.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
