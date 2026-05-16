import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    // Cria o fluxo principal
    const flow = await prisma.flow.create({
      data: {
        name: 'Atendimento de Cursos Inteligente (IA)',
        description: 'IA atende clientes que procuram informações sobre cursos usando a Base de Conhecimento.',
        trigger: 'KEYWORD',
        triggerConfig: JSON.stringify({
          keywords: ['curso', 'cursos', 'informação', 'informações', 'saber mais', 'formação', 'pós', 'pós-graduação', 'especialização', 'acupuntura', 'naturopatia', 'massoterapia', 'yoga', 'meditação'],
          keywordMatchMode: 'contains',
          cooldownHours: 0
        }),
        isActive: true,
      }
    });

    // Cria o nó de Chatbot IA associado ao fluxo
    await prisma.flowNode.create({
      data: {
        flowId: flow.id,
        type: 'AI_CHATBOT',
        name: 'Assistente Especialista (IA)',
        position: 0,
        config: JSON.stringify({
          aiPrompt: `Você é a Sol, a assistente virtual inteligente e acolhedora do Sol Instituto Terapêutico.
Sua missão é ajudar os alunos e clientes que buscam informações sobre nossos cursos.

REGRAS IMPORTANTES:
1. Responda SEMPRE em português do Brasil de forma acolhedora, humana e educada.
2. Seja objetivo: respostas curtas (máximo de 3 parágrafos curtos).
3. Use a Base de Conhecimento para passar informações sobre cursos, datas, valores e horários.
4. Se perguntarem algo que não está na Base de Conhecimento, diga de forma educada que vai transferir para um consultor.
5. Se o cliente pedir para falar com um humano, atendente ou pessoa real, não invente desculpas, diga apenas "Vou te transferir agora mesmo!".

Aja sempre como uma representante orgulhosa do Sol Instituto, nossa escola é referência no ensino de terapias naturais há mais de 15 anos!`,
          aiModel: 'gpt-3.5-turbo',
          aiMaxTokens: 500,
          historyLimit: 15,
          useKnowledge: true
        })
      }
    });

    console.log('✅ Automação criada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar automação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
