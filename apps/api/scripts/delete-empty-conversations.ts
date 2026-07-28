import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== EXECUÇÃO DA LIMPEZA DE CONVERSAS VAZIAS ===');

  // Deletar conversas que possuem 0 mensagens
  const deleteResult = await prisma.conversation.deleteMany({
    where: {
      messages: {
        none: {}
      }
    }
  });

  console.log(`✅ Foram deletadas ${deleteResult.count} conversas vazias da Caixa de Entrada.`);
  console.log('ℹ️ Todos os contatos permanecem salvos normalmente na tabela Contact.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
