import * as fs from 'fs';
import * as path from 'path';

function main() {
  const sourcePath = path.join(process.cwd(), 'listas_whatsapp_sem_matriculados', 'lista_massoterapia_sem_matriculados.csv');

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

  // Pular cabeçalho original e pegar linhas de dados
  const dataRows = lines.slice(1);
  const totalContacts = dataRows.length;

  console.log(`Total de contatos na lista de Massoterapia: ${totalContacts}`);

  // Dividir exatamente ao meio em 2 partes iguais
  const halfIndex = Math.ceil(totalContacts / 2);
  const part1Rows = dataRows.slice(0, halfIndex);
  const part2Rows = dataRows.slice(halfIndex);

  const outputDir = path.join(process.cwd(), 'listas_whatsapp_sem_matriculados', 'massoterapia_dividida_2');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Parte 1
  const tag1 = 'Massoterapia parte 1 - 27-07';
  const linesPart1 = part1Rows.map(row => {
    const cols = row.split('","').map(c => c.replace(/^"/, '').replace(/"$/, ''));
    const name = cols[0] || 'Sem Nome';
    const phone = cols[1] || '';
    return `${name};${phone};${tag1}`;
  });
  const file1Path = path.join(outputDir, 'lista_massoterapia_parte_1.csv');
  fs.writeFileSync(file1Path, linesPart1.join('\n'), 'utf-8');
  console.log(`Parte 1 gerada (${linesPart1.length} linhas): ${file1Path}`);

  // Parte 2
  const tag2 = 'Massoterapia parte 2 - 27-07';
  const linesPart2 = part2Rows.map(row => {
    const cols = row.split('","').map(c => c.replace(/^"/, '').replace(/"$/, ''));
    const name = cols[0] || 'Sem Nome';
    const phone = cols[1] || '';
    return `${name};${phone};${tag2}`;
  });
  const file2Path = path.join(outputDir, 'lista_massoterapia_parte_2.csv');
  fs.writeFileSync(file2Path, linesPart2.join('\n'), 'utf-8');
  console.log(`Parte 2 gerada (${linesPart2.length} linhas): ${file2Path}`);
}

main();
