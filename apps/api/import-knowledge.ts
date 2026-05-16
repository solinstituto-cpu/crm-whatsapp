import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const urls = [
  "https://solinstituto.com.br/curso-acupuntura-completo",
  "https://solinstituto.com.br/curso-nat-pos-presencial",
  "https://solinstituto.com.br/curso-nat-pos-fds",
  "https://solinstituto.com.br/jornada-em-yoga-2026",
  "https://solinstituto.com.br/jornada-em-yoga-mensal-2026",
  "https://solinstituto.com.br/curso-yoga-instrutor-mensal",
  "https://solinstituto.com.br/curso-yoga-instrutor-semanal",
  "https://solinstituto.com.br/meditacao-jornada-portais-2026",
  "https://solinstituto.com.br/curso-mas-jornada-sem-pos",
  "https://solinstituto.com.br/curso-mas-jornada-fds-pos"
];

function cleanHtml(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    text = bodyMatch[1];
  }

  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&Aacute;/g, 'Á').replace(/&aacute;/g, 'á')
             .replace(/&Eacute;/g, 'É').replace(/&eacute;/g, 'é')
             .replace(/&Iacute;/g, 'Í').replace(/&iacute;/g, 'í')
             .replace(/&Oacute;/g, 'Ó').replace(/&oacute;/g, 'ó')
             .replace(/&Uacute;/g, 'Ú').replace(/&uacute;/g, 'ú')
             .replace(/&Ccedil;/g, 'Ç').replace(/&ccedil;/g, 'ç')
             .replace(/&atilde;/g, 'ã').replace(/&Atilde;/g, 'Ã')
             .replace(/&otilde;/g, 'õ').replace(/&Otilde;/g, 'Õ')
             .replace(/&acirc;/g, 'â').replace(/&ecirc;/g, 'ê').replace(/&ocirc;/g, 'ô')
             .replace(/&copy;/g, '©');
  
  // Remover cabeçalhos e rodapés repetitivos
  text = text.replace(/O Sol Instituto.*Transforme Vidas.*/i, '');
  text = text.replace(/A sua refer.ncia no ensino de terapias.*/i, '');
  text = text.replace(/Links R.pidos.*Design totalmente remodelado/i, '');

  return text.trim();
}

async function run() {
  for (const url of urls) {
    console.log(`Extraindo: ${url}`);
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
      });
      
      const titleMatch = response.data.match(/<title>([^<]*)<\/title>/i);
      let title = titleMatch ? titleMatch[1].trim() : url.split('/').pop() || url;
      title = title.replace(' - Sol Instituto Terapêutico', '').replace(' | Sol Instituto', '').trim();
      
      const content = cleanHtml(response.data);
      const finalContent = content.substring(0, 8000); 
      
      const keywords = url.split('/').pop()?.replace(/-/g, ', ') || '';

      await prisma.knowledgeBase.create({
        data: {
          title: `Curso: ${title}`,
          content: `URL Fonte: ${url}\n\n${finalContent}`,
          category: 'Cursos',
          keywords: keywords,
          priority: 10,
          isActive: true
        }
      });
      console.log(`✅ Salvo na Base: ${title}`);
    } catch (e: any) {
      console.error(`❌ Falha em ${url}: ${e.message}`);
    }
  }
  await prisma.$disconnect();
}

run();
