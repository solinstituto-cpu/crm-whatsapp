import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('🏷️  Atribuindo tag "Anuncio Google" para conversas qualificadas (Vendas Sol)')
  console.log('='.repeat(60))

  const vendasSolAccount = await prisma.whatsAppAccount.findFirst({
    where: {
      name: { contains: 'Vendas Sol', mode: 'insensitive' },
    },
  })

  if (!vendasSolAccount) {
    console.error('❌ Conta "Vendas Sol" não encontrada!')
    return
  }

  // Buscar todas as conversas da conta Vendas Sol
  const conversations = await prisma.conversation.findMany({
    where: { whatsappAccountId: vendasSolAccount.id },
    select: {
      id: true,
      contactId: true,
      contact: { select: { id: true, name: true, phoneE164: true, tags: true } },
    },
  })

  console.log(`Buscando em ${conversations.length} conversas...`)

  let taggedCount = 0

  for (const conv of conversations) {
    if (!conv.contact) continue

    // Buscar a primeira mensagem recebida do cliente nesta conversa
    const firstInbound = await prisma.message.findFirst({
      where: {
        conversationId: conv.id,
        direction: 'IN',
      },
      orderBy: { createdAt: 'asc' },
      select: { body: true },
    })

    if (!firstInbound || !firstInbound.body) continue

    const bodyLower = firstInbound.body.toLowerCase().trim()
    const isAnuncioGoogle =
      bodyLower.startsWith('olá! quero garantir') ||
      bodyLower.startsWith('encontrei v') ||
      bodyLower.startsWith('vi voces') ||
      bodyLower.startsWith('vi vcs')

    if (isAnuncioGoogle) {
      let currentTags: string[] = []
      try {
        currentTags = conv.contact.tags ? JSON.parse(conv.contact.tags) : []
      } catch {
        currentTags = []
      }

      if (!currentTags.includes('Anuncio Google')) {
        currentTags.push('Anuncio Google')
        await prisma.contact.update({
          where: { id: conv.contact.id },
          data: { tags: JSON.stringify(currentTags) },
        })
        taggedCount++
        console.log(`  🟠 Anuncio Google: ${conv.contact.name || conv.contact.phoneE164}`)
      }
    }
  }

  console.log(`\n✅ Concluído! Tag "Anuncio Google" aplicadas a ${taggedCount} contatos.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
