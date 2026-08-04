import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando índices no banco de produção...\n');
  
  const indexes: any = await prisma.$queryRawUnsafe(`
    SELECT schemaname, tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  
  console.log(`📋 Total de índices no banco: ${indexes.length}\n`);
  
  let currentTable = '';
  for (const idx of indexes) {
    if (idx.tablename !== currentTable) {
      currentTable = idx.tablename;
      console.log(`\n📁 ${currentTable}:`);
    }
    console.log(`   - ${idx.indexname}`);
  }

  await prisma.$disconnect();
}
main();
