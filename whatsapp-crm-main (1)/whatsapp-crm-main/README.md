# WhatsApp CRM - Sistema CRM leve com WhatsApp Cloud API

Um CRM simples e eficiente para vendas e atendimento, integrado com a WhatsApp Cloud API da Meta. Inclui gestão de contatos, pipeline kanban, automações, templates e suporte a múltiplos atendentes.

## 🚀 Funcionalidades

### Core Features
- **📱 Integração WhatsApp**: Envio e recebimento de mensagens via Cloud API
- **👥 Gestão de Contatos**: CRUD completo com tags, importação CSV e deduplicação
- **💬 Inbox Unificado**: Conversas centralizadas com histórico completo
- **🔄 Pipeline Kanban**: Gestão visual de vendas com drag & drop
- **🤖 Automações**: Regras e gatilhos para respostas automáticas
- **📄 Templates**: Gestão de templates aprovados pela Meta
- **📊 Relatórios**: Métricas básicas e SLA de atendimento

### Recursos Avançados
- **⏰ Janela 24h**: Gestão automática da janela de mensagens gratuitas
- **🚫 Opt-out**: Sistema de cancelamento por palavra-chave
- **👤 Multi-atendente**: Suporte a múltiplos usuários com RBAC
- **⚡ Respostas Rápidas**: Templates com variáveis personalizadas
- **📎 Mídia**: Upload e envio de imagens, documentos, áudio e vídeo
- **🔔 Notificações**: Status de entrega e leitura em tempo real

## 🏗️ Arquitetura

### Backend
- **NestJS + TypeScript**: Framework modular e escalável
- **Prisma + PostgreSQL**: ORM type-safe com migrations
- **BullMQ + Redis**: Filas para envios e retry automático
- **Zod**: Validação de DTOs e schemas
- **JWT + Passport**: Autenticação segura

### Frontend
- **Next.js 14**: App Router com Server Components
- **Tailwind CSS**: Styling utilitário e responsivo
- **shadcn/ui**: Componentes acessíveis e modernos
- **React Query**: Cache e sincronização de estado
- **React Hook Form**: Formulários performáticos

### Infraestrutura
- **Docker Compose**: Containerização para desenvolvimento
- **Redis**: Cache e filas de mensagens
- **PostgreSQL**: Banco de dados principal

## 📋 Pré-requisitos

- Node.js 18+
- Docker & Docker Compose
- Conta Meta Business
- WhatsApp Business API configurada

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd whatsapp-crm
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crm

# Redis
REDIS_URL=redis://localhost:6379

# WhatsApp Meta Cloud API
META_WA_PHONE_NUMBER_ID=your_phone_number_id
META_WA_TOKEN=your_access_token
META_WA_APP_ID=your_app_id
META_WA_APP_SECRET=your_app_secret
WA_VERIFY_TOKEN=sua-string-secreta-unica

# URLs
WEBAPP_URL=http://localhost:3000
API_URL=http://localhost:4000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# JWT
JWT_SECRET=your-jwt-secret
```

### 3. Instale as dependências
```bash
npm run setup
```

### 4. Inicie os serviços
```bash
npm run docker:up
```

### 5. Configure o banco de dados
```bash
npm run db:push
npm run db:seed
```

### 6. Inicie o desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em:
- **Web App**: http://localhost:3000
- **API**: http://localhost:4000

## 📱 Configuração WhatsApp

### 1. Obter Credenciais

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie uma nova aplicação (Business)
3. Adicione o produto "WhatsApp Business API"
4. Configure o número de telefone de teste

### 2. Configurar Webhook

- **URL**: `https://seu-dominio.com/api/wa/webhook`
- **Token de verificação**: Use o valor de `WA_VERIFY_TOKEN`
- **Campos**: `messages`, `message_status`

### 3. Obter Token de Acesso

No painel do WhatsApp Business API, copie:
- **Phone Number ID**
- **Access Token**
- **App ID**
- **App Secret**

## 🔧 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev          # Inicia API + Web + Queue worker
npm run dev:api      # Apenas a API
npm run dev:web      # Apenas o frontend
```

### Banco de Dados
```bash
npm run db:generate  # Gera o Prisma Client
npm run db:push      # Aplica o schema ao banco
npm run db:seed      # Popula com dados de exemplo
npm run db:reset     # Reset completo do banco
```

### Docker
```bash
npm run docker:up    # Sobe todos os serviços
npm run docker:down  # Para todos os serviços
npm run docker:build # Rebuilda as imagens
```

### Testes
```bash
npm run test         # Executa todos os testes
npm run test:watch   # Testes em modo watch
npm run test:e2e     # Testes end-to-end
```

## 🗄️ Estrutura do Banco

### Entidades Principais

```sql
User (id, name, email, role)
Contact (id, name, phoneE164, tags[], lastMessageAt, assignedTo)
Conversation (id, contactId, status, lastWAStatus)
Message (id, conversationId, direction, type, body, waMessageId, status)
PipelineStage (id, name, order)
Deal (id, contactId, stageId, amount, notes)
Template (id, name, category, language, components, waTemplateName)
Rule (id, name, when, then, enabled)
```

## 🔌 Endpoints da API

### Autenticação
```
POST /api/auth/login
GET  /api/auth/profile
```

### WhatsApp
```
GET  /api/wa/webhook      # Verificação
POST /api/wa/webhook      # Eventos
POST /api/wa/send         # Enviar mensagem
POST /api/wa/send-template # Enviar template
```

### Contatos
```
GET    /api/contacts      # Listar
POST   /api/contacts      # Criar
GET    /api/contacts/:id  # Buscar
PATCH  /api/contacts/:id  # Atualizar
DELETE /api/contacts/:id  # Deletar
```

### Conversas
```
GET  /api/conversations           # Listar
GET  /api/conversations/:id       # Buscar
POST /api/conversations/:id/messages # Adicionar mensagem
```

## 🧪 Testando a Integração

### 1. Webhook
```bash
curl -X GET "http://localhost:4000/api/wa/webhook?hub.mode=subscribe&hub.verify_token=sua-string-secreta&hub.challenge=test"
```

### 2. Enviar Mensagem
```bash
curl -X POST http://localhost:4000/api/wa/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+5511999999999",
    "type": "text",
    "text": "Olá! Esta é uma mensagem de teste."
  }'
```

### 3. Enviar Template
```bash
curl -X POST http://localhost:4000/api/wa/send-template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+5511999999999",
    "templateName": "welcome_template",
    "language": "pt_BR"
  }'
```

## 👥 Usuários Padrão

Após executar o seed, você terá:

- **Admin**: admin@crm.com / admin123
- **Agent**: agent@crm.com / agent123

## 🚀 Deploy

### Vercel (Frontend)
1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Railway/Render (Backend)
1. Configure o serviço PostgreSQL
2. Configure o serviço Redis
3. Deploy da API com variáveis de ambiente

## 📚 Recursos e Referências

### WhatsApp Cloud API
- [Getting Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
- [Media Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)

### Compliance e Boas Práticas
- [Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Commerce Policy](https://www.whatsapp.com/legal/commerce-policy)
- [Opt-out Guidelines](https://developers.facebook.com/docs/whatsapp/cloud-api/support/opt-out)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📧 Email: suporte@seudominio.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/whatsapp-crm/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/seu-usuario/whatsapp-crm/wiki)

---

**⚠️ Aviso**: Este é um projeto de demonstração. Para uso em produção, implemente medidas adicionais de segurança, monitoramento e backup.