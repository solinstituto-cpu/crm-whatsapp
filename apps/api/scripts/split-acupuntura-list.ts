import * as fs from 'fs';
import * as path from 'path';

function main() {
  const sourcePath = path.join(process.cwd(), 'listas_whatsapp_sem_matriculados', 'lista_acupuntura_sem_matriculados.csv');

  if (!fs.existsSync(sourcePath)) {
    console.error(`Arquivo não encontrado: ${sourcePath}`);
    return;
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length <= 1) {
    console.log('Arquivo vazio ou contém apenas o cabeçalho.');
    return;
  }

  // Pular o cabeçalho original e pegar todas as linhas de dados
  const dataRows = lines.slice(1);

  console.log(`Total de contatos para reformatar: ${dataRows.length}`);

  const chunkSize = 200;
  const totalParts = Math.ceil(dataRows.length / chunkSize);

  const outputDir = path.join(process.cwd(), 'listas_whatsapp_sem_matriculados', 'acupuntura_dividida_200');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < totalParts; i++) {
    const partNumber = i + 1;
    const tagTerm = `acupuntura-27-07-parte-${partNumber}`;
    const chunk = dataRows.slice(i * chunkSize, (i + 1) * chunkSize);

    const formattedLines: string[] = [];

    for (const row of chunk) {
      // O CSV original está no formato: "Nome","Telefone","TagsOrigem","DataCadastro","CriterioClassificacao"
      // Vamos extrair Nome e Telefone limpos
      const cols = row.split('","').map(c => c.replace(/^"/, '').replace(/"$/, ''));
      const name = cols[0] || 'Sem Nome';
      const phone = cols[1] || '';

      // Formato solicitado: Nome;Telefone;Tag
      // Exemplo: Maria Santos;11988887777;acupuntura-27-07-parte-1
      formattedLines.push(`${name};${phone};${tagTerm}`);
    }

    const fileContent = formattedLines.join('\n');
    const fileName = `lista_acupuntura_parte_${partNumber}_de_${totalParts}.csv`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`Parte ${partNumber}/${totalParts} formatada com sucesso (${chunk.length} linhas): ${filePath}`);
  }
}

main();
