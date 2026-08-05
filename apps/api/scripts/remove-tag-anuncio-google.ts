import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('🗑️  Removendo tag "Anuncio Google" de todos os contatos')
  console.log('='.repeat(60))

  // Buscar contatos que tenham a tag "Anuncio Google"
  const contacts = await prisma.contact.findMany({
    where: {
      tags: { contains: 'Anuncio Google' }
    },
    select: { id: true, name: true, tags: true }
  })

  console.log(`Encontrados ${contacts.length} contatos com tag "Anuncio Google"`)

  let updated = 0
  for (const contact of contacts) {
    let tags: string[] = []
    try {
      tags = contact.tags ? JSON.parse(contact.tags) : []
    } catch { tags = [] }

    const newTags = tags.filter(t => t !== 'Anuncio Google')
    
    await prisma.contact.update({
      where: { id: contact.id },
      data: { tags: newTags.length > 0 ? JSON.stringify(newTags) : '[]' }
    })
    
    updated++
    if (updated % 50 === 0) console.log(`  Processados: ${updated}/${contacts.length}`)
  }

  console.log(`\n✅ Tag "Anuncio Google" removida de ${updated} contatos`)
  console.log('As badges agora são determinadas pelo conteúdo da primeira mensagem')
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1) })
