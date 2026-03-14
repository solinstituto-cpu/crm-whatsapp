import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@crm.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@crm.com' },
    update: {},
    create: {
      name: 'Agent User',
      email: 'agent@crm.com',
      password: agentPassword,
      role: 'AGENT',
    },
  });

  console.log('✅ Users created');

  // Create pipeline stages
  const stages = await Promise.all([
    prisma.pipelineStage.upsert({
      where: { id: 'stage-1' },
      update: {},
      create: {
        id: 'stage-1',
        name: 'Lead',
        order: 1,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-2' },
      update: {},
      create: {
        id: 'stage-2',
        name: 'Qualified',
        order: 2,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-3' },
      update: {},
      create: {
        id: 'stage-3',
        name: 'Proposal',
        order: 3,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-4' },
      update: {},
      create: {
        id: 'stage-4',
        name: 'Negotiation',
        order: 4,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-5' },
      update: {},
      create: {
        id: 'stage-5',
        name: 'Closed Won',
        order: 5,
      },
    }),
  ]);

  console.log('✅ Pipeline stages created');

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { phoneE164: '+5511999999999' },
      update: {},
      create: {
        name: 'João Silva',
        phoneE164: '+5511999999999',
        tags: ['lead', 'interessado'],
        assignedToId: agent.id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.contact.upsert({
      where: { phoneE164: '+5511888888888' },
      update: {},
      create: {
        name: 'Maria Santos',
        phoneE164: '+5511888888888',
        tags: ['cliente', 'vip'],
        assignedToId: admin.id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.contact.upsert({
      where: { phoneE164: '+5511777777777' },
      update: {},
      create: {
        name: 'Pedro Oliveira',
        phoneE164: '+5511777777777',
        tags: ['lead'],
        lastMessageAt: new Date(),
      },
    }),
    prisma.contact.upsert({
      where: { phoneE164: '+5511666666666' },
      update: {},
      create: {
        name: 'Ana Costa',
        phoneE164: '+5511666666666',
        tags: ['cliente'],
        assignedToId: agent.id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.contact.upsert({
      where: { phoneE164: '+5511555555555' },
      update: {},
      create: {
        name: 'Carlos Ferreira',
        phoneE164: '+5511555555555',
        tags: ['lead', 'qualificado'],
        lastMessageAt: new Date(),
      },
    }),
  ]);

  console.log('✅ Contacts created');

  // Create conversations
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        contactId: contacts[0].id,
        status: 'OPEN',
        assignedToId: agent.id,
      },
    }),
    prisma.conversation.create({
      data: {
        contactId: contacts[1].id,
        status: 'OPEN',
        assignedToId: admin.id,
      },
    }),
    prisma.conversation.create({
      data: {
        contactId: contacts[2].id,
        status: 'PENDING',
      },
    }),
  ]);

  console.log('✅ Conversations created');

  // Create deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        contactId: contacts[0].id,
        stageId: stages[0].id,
        amount: 5000,
        notes: 'Interessado em plano premium',
        assignedToId: agent.id,
      },
    }),
    prisma.deal.create({
      data: {
        contactId: contacts[1].id,
        stageId: stages[2].id,
        amount: 10000,
        notes: 'Proposta enviada',
        assignedToId: admin.id,
      },
    }),
    prisma.deal.create({
      data: {
        contactId: contacts[4].id,
        stageId: stages[1].id,
        amount: 3000,
        notes: 'Lead qualificado',
      },
    }),
  ]);

  console.log('✅ Deals created');

  // Create templates
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: 'welcome_message',
        category: 'greeting',
        language: 'pt_BR',
        components: {
          header: {
            type: 'text',
            text: 'Bem-vindo! 👋',
          },
          body: {
            type: 'text',
            text: 'Olá {{firstName}}, obrigado por entrar em contato conosco! Como posso ajudá-lo hoje?',
          },
          footer: {
            type: 'text',
            text: 'Equipe de Atendimento',
          },
        },
        waTemplateName: 'welcome_message',
        enabled: true,
      },
    }),
    prisma.template.create({
      data: {
        name: 'follow_up',
        category: 'follow_up',
        language: 'pt_BR',
        components: {
          header: {
            type: 'text',
            text: 'Seguimento 📞',
          },
          body: {
            type: 'text',
            text: 'Olá {{firstName}}, como está o andamento do seu pedido? Precisa de mais alguma informação?',
          },
          footer: {
            type: 'text',
            text: 'Equipe de Vendas',
          },
        },
        waTemplateName: 'follow_up',
        enabled: true,
      },
    }),
  ]);

  console.log('✅ Templates created');

  // Create rules
  const rules = await Promise.all([
    prisma.rule.create({
      data: {
        name: 'Auto Welcome New Contacts',
        when: {
          type: 'contact_created',
        },
        then: {
          type: 'send_template',
          templateName: 'welcome_message',
          parameters: {
            body: ['{{firstName}}'],
          },
        },
        enabled: true,
      },
    }),
    prisma.rule.create({
      data: {
        name: 'Auto Follow Up',
        when: {
          type: 'tag_added',
          value: 'interessado',
        },
        then: {
          type: 'send_template',
          templateName: 'follow_up',
          parameters: {
            body: ['{{firstName}}'],
          },
        },
        enabled: true,
      },
    }),
  ]);

  console.log('✅ Rules created');

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        direction: 'IN',
        type: 'TEXT',
        body: 'Olá, gostaria de saber mais sobre seus produtos',
        status: 'DELIVERED',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        direction: 'OUT',
        type: 'TEXT',
        body: 'Olá! Fico feliz em ajudá-lo. Que tipo de produto você está procurando?',
        status: 'SENT',
        sentById: agent.id,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[1].id,
        direction: 'IN',
        type: 'TEXT',
        body: 'Preciso de suporte técnico',
        status: 'DELIVERED',
      },
    }),
  ]);

  console.log('✅ Sample messages created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('Admin: admin@crm.com / admin123');
  console.log('Agent: agent@crm.com / agent123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

