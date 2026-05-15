import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando backup das conversas e contatos...');
  
  try {
    const contacts = await prisma.contact.findMany();
    console.log(`- ${contacts.length} contatos encontrados.`);

    const conversations = await prisma.conversation.findMany({
      include: {
        messages: true
      }
    });
    console.log(`- ${conversations.length} conversas encontradas com suas mensagens.`);

    const backupData = {
      timestamp: new Date().toISOString(),
      contacts,
      conversations
    };

    const backupPath = path.join('C:\\Users\\User\\Desktop', `backup_conversas_${Date.now()}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    console.log(`\n✅ Backup concluído com sucesso!`);
    console.log(`Arquivo salvo em: ${backupPath}`);
  } catch (error) {
    console.error('Erro ao realizar o backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
