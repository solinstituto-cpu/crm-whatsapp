import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('🚀 Atualizando histórico de mensagens para identificar Anúncio Google')
  console.log('='.repeat(60))

  const conversations = await prisma.conversation.findMany({
    select: {
      id: true,
      contactId: true,
      contact: { select: { id: true, name: true, tags: true } },
    },
  })

  let count = 0

  for (const conv of conversations) {
    if (!conv.contact) continue

    // Buscar a primeira mensagem IN do cliente nesta conversa
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
    const isAnuncio =
      bodyLower.startsWith('olá! quero garantir') ||
      bodyLower.startsWith('encontrei v') ||
      bodyLower.startsWith('vi voces') ||
      bodyLower.startsWith('vi vcs')

    if (isAnuncio) {
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
        count++
        console.log(`  ✅ Anuncio Google marcado: ${conv.contact.name}`)
      }
    }
  }

  console.log(`\n🎉 Total de ${count} conversas atualizadas com sucesso!`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
