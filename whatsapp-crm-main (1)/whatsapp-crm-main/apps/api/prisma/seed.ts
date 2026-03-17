import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.template.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.quickReply.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const deniPassword = await bcrypt.hash('deni123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@crm.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const agent = await prisma.user.create({
    data: {
      name: 'Agent User',
      email: 'agent@crm.com',
      password: agentPassword,
      role: 'AGENT',
    },
  });

  // Criar usuários personalizados
  await prisma.user.create({
    data: {
      name: 'Deni Morais',
      email: 'deni.morais777@gmail.com',
      password: deniPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Deni Atendente',
      email: 'denimorais666@gmail.com',
      password: deniPassword,
      role: 'AGENT',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Deni Sol Instituto',
      email: 'deni@solinstituto.com',
      password: deniPassword,
      role: 'ADMIN',
    },
  });

  // Create pipeline stages (para escola)
  const stages = await Promise.all([
    prisma.pipelineStage.create({
      data: { name: 'Novo Lead', order: 1, color: '#3B82F6' },
    }),
    prisma.pipelineStage.create({
      data: { name: 'Contato Realizado', order: 2, color: '#06B6D4' },
    }),
    prisma.pipelineStage.create({
      data: { name: 'Visita Agendada', order: 3, color: '#F59E0B' },
    }),
    prisma.pipelineStage.create({
      data: { name: 'Em Negociação', order: 4, color: '#F97316' },
    }),
    prisma.pipelineStage.create({
      data: { name: 'Proposta Enviada', order: 5, color: '#8B5CF6' },
    }),
    prisma.pipelineStage.create({
      data: { name: 'Matrícula Fechada', order: 6, color: '#22C55E' },
    }),
    prisma.pipelineStage.create({
      data: { name: 'Perdido', order: 7, color: '#EF4444' },
    }),
  ]);

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'João Silva',
        phoneE164: '+5511999999001',
        tags: JSON.stringify(['lead', 'interessado']),
        assignedToId: agent.id,
        consentedAt: new Date(),
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Maria Santos',
        phoneE164: '+5511999999002',
        tags: JSON.stringify(['cliente', 'vip']),
        assignedToId: agent.id,
        consentedAt: new Date(),
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Pedro Costa',
        phoneE164: '+5511999999003',
        tags: JSON.stringify(['lead']),
        assignedToId: admin.id,
        consentedAt: new Date(),
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Ana Oliveira',
        phoneE164: '+5511999999004',
        tags: JSON.stringify(['cliente', 'recorrente']),
        consentedAt: new Date(),
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Carlos Mendes',
        phoneE164: '+5511999999005',
        tags: JSON.stringify(['prospect']),
        consentedAt: new Date(),
      },
    }),
  ]);

  // Create deals
  await Promise.all([
    prisma.deal.create({
      data: {
        title: 'Venda Produto Premium',
        contactId: contacts[0].id,
        stageId: stages[0].id,
        ownerId: agent.id,
        amount: 1500,
        description: 'Interessado no produto premium',
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Consultoria Empresarial',
        contactId: contacts[1].id,
        stageId: stages[1].id,
        ownerId: agent.id,
        amount: 2500,
        description: 'Negociação em andamento',
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Projeto Integração',
        contactId: contacts[2].id,
        stageId: stages[2].id,
        ownerId: admin.id,
        amount: 3000,
        description: 'Deal fechado com sucesso',
      },
    }),
  ]);

  // Create templates
  await Promise.all([
    prisma.template.create({
      data: {
        name: 'Boas-vindas',
        category: 'UTILITY',
        language: 'pt_BR',
        waTemplateName: 'welcome_template',
        status: 'APPROVED',
        components: JSON.stringify({
          type: 'template',
          name: 'welcome_template',
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: '{{1}}' }
              ]
            }
          ]
        }),
      },
    }),
    prisma.template.create({
      data: {
        name: 'Confirmação Pedido',
        category: 'UTILITY',
        language: 'pt_BR',
        waTemplateName: 'order_confirmation',
        status: 'APPROVED',
        components: JSON.stringify({
          type: 'template',
          name: 'order_confirmation',
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: '{{1}}' },
                { type: 'text', text: '{{2}}' }
              ]
            }
          ]
        }),
      },
    }),
  ]);

  // Create rules
  await Promise.all([
    prisma.rule.create({
      data: {
        name: 'Novo contato → Enviar boas-vindas',
        when: JSON.stringify({
          type: 'contact_created',
          conditions: []
        }),
        then: JSON.stringify({
          type: 'send_template',
          templateName: 'welcome_template',
          delay: 0
        }),
        enabled: true,
      },
    }),
    prisma.rule.create({
      data: {
        name: 'Tag VIP → Atribuir ao Admin',
        when: JSON.stringify({
          type: 'tag_added',
          conditions: [{ tag: 'vip' }]
        }),
        then: JSON.stringify({
          type: 'assign_to_user',
          userId: admin.id
        }),
        enabled: true,
      },
    }),
  ]);

  // Create quick replies
  await Promise.all([
    prisma.quickReply.create({
      data: {
        name: 'Saudação',
        content: 'Olá {{firstName}}! Como posso ajudá-lo hoje?',
        variables: JSON.stringify(['firstName']),
      },
    }),
    prisma.quickReply.create({
      data: {
        name: 'Horário de Atendimento',
        content: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.',
        variables: JSON.stringify([]),
      },
    }),
    prisma.quickReply.create({
      data: {
        name: 'Informações Contato',
        content: 'Para mais informações, entre em contato conosco:\n📞 (11) 99999-9999\n📧 contato@empresa.com',
        variables: JSON.stringify([]),
      },
    }),
  ]);

  // Create sample conversations and messages
  const conversation1 = await prisma.conversation.create({
    data: {
      contactId: contacts[0].id,
      status: 'OPEN',
      lastWAStatus: 'sent',
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      contactId: contacts[1].id,
      status: 'PENDING',
      lastWAStatus: 'delivered',
    },
  });

  // Add sample messages
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        direction: 'IN',
        type: 'text',
        body: 'Olá! Tenho interesse em conhecer seus produtos.',
        waMessageId: 'wamid.sample1',
        status: 'READ',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        direction: 'OUT',
        type: 'text',
        body: 'Olá João! Ficamos felizes com seu interesse. Posso te enviar nosso catálogo?',
        waMessageId: 'wamid.sample2',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 3000000), // 50 minutes ago
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        direction: 'IN',
        type: 'text',
        body: 'Sim, por favor!',
        waMessageId: 'wamid.sample3',
        status: 'READ',
        createdAt: new Date(Date.now() - 2400000), // 40 minutes ago
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        direction: 'IN',
        type: 'text',
        body: 'Bom dia! Gostaria de saber sobre os preços.',
        waMessageId: 'wamid.sample4',
        status: 'READ',
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@crm.com / admin123');
  console.log('👤 Agent user: agent@crm.com / agent123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });