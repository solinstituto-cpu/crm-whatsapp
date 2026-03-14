# CRM WhatsApp - Sistema de CRM Integrado com WhatsApp Cloud API

Um sistema completo de CRM (Customer Relationship Management) integrado com a WhatsApp Cloud API da Meta, desenvolvido com Next.js 14, NestJS, PostgreSQL e Docker.

## 🚀 Funcionalidades

### Core Features
- **Gestão de Contatos**: Cadastro, edição e organização de contatos com tags
- **Pipeline de Vendas**: Board Kanban para gestão de negócios
- **Caixa de Entrada Unificada**: Interface para gerenciar conversas do WhatsApp
- **Templates de Mensagem**: Criação e envio de templates aprovados
- **Automações**: Regras para envio automático de mensagens
- **Métricas e Relatórios**: Dashboard com indicadores de performance
- **Multi-atendentes**: Suporte a múltiplos usuários com diferentes níveis de acesso

### Integração WhatsApp
- **Envio/Recebimento**: Mensagens de texto, mídia, localização, contatos
- **Webhooks**: Processamento automático de mensagens recebidas
- **Janela de 24h**: Controle automático de envios fora da janela permitida
- **Templates**: Envio de templates aprovados pela Meta
- **Status de Entrega**: Acompanhamento de status das mensagens
- **Opt-out**: Sistema de descadastro automático

## 🛠️ Tech Stack

### Backend
- **Node.js** + **NestJS** - Framework backend
- **TypeScript** - Linguagem principal
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e filas
- **BullMQ** - Sistema de filas para envio de mensagens
- **Zod** - Validação de dados

### Frontend
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca de interface
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes UI
- **NextAuth.js** - Autenticação
- **React Hook Form** - Formulários
- **Zod** - Validação de formulários

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração local
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e filas

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Conta no Facebook Developers
- Acesso à WhatsApp Cloud API

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd crm-whatsapp
```

### 2. Configure as variáveis de ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Database
DATABASE_URL=postgresql://user:pass@db:5432/crm
REDIS_URL=redis://redis:6379

# WhatsApp Cloud API
META_WA_PHONE_NUMBER_ID=your_phone_number_id
META_WA_TOKEN=your_access_token
META_WA_APP_ID=your_app_id
META_WA_APP_SECRET=your_app_secret
WA_VERIFY_TOKEN=your_verify_token

# Application URLs
WEBAPP_URL=http://localhost:3000
API_URL=http://localhost:4000

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 3. Inicie os serviços
```bash
docker-compose up -d
```

### 4. Execute as migrações e seed
```bash
# Backend
docker-compose exec api npm run prisma:migrate
docker-compose exec api npm run prisma:seed

# Frontend (se necessário)
docker-compose exec web npm run build
```

### 5. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Credenciais padrão**:
  - Admin: `admin@crm.com` / `admin123`
  - Agent: `agent@crm.com` / `agent123`

## 📱 Configuração WhatsApp Cloud API

### 1. Criar App no Facebook Developers
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app
3. Adicione o produto "WhatsApp Business API"
4. Configure o número de telefone

### 2. Obter Credenciais
- **Phone Number ID**: Encontrado em WhatsApp > API Setup
- **Access Token**: Token temporário ou permanente
- **App ID** e **App Secret**: Nas configurações do app
- **Webhook Verify Token**: Crie um token secreto

### 3. Configurar Webhook
- **URL**: `https://seu-dominio.com/api/wa/webhook`
- **Verify Token**: O mesmo definido no `.env`
- **Campos**: `messages`, `message_status`

### 4. Criar Templates de Mensagem
1. Acesse WhatsApp Business Manager
2. Crie templates seguindo as diretrizes da Meta
3. Aguarde aprovação
4. Configure no sistema

## 🔧 Desenvolvimento

### Scripts Disponíveis

#### Backend (API)
```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

#### Frontend (Web)
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint
```

#### Docker
```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f api
docker-compose logs -f web
```

## 📊 Estrutura do Projeto

```
crm-whatsapp/
├── api/                    # Backend NestJS
│   ├── src/
│   │   ├── auth/           # Autenticação
│   │   ├── contacts/       # Gestão de contatos
│   │   ├── conversations/  # Conversas
│   │   ├── messages/       # Mensagens
│   │   ├── pipeline/       # Pipeline de vendas
│   │   ├── templates/      # Templates
│   │   ├── rules/          # Automações
│   │   ├── whatsapp/       # Integração WhatsApp
│   │   └── queue/          # Sistema de filas
│   └── prisma/             # Schema e migrações
├── web/                    # Frontend Next.js
│   ├── app/                # App Router
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── lib/            # Utilitários
│   │   └── hooks/          # Custom hooks
└── docker-compose.yml     # Orquestração
```

## 🔐 Segurança

- **Autenticação**: NextAuth.js com JWT
- **Autorização**: RBAC (Admin/Agent)
- **Validação**: Zod para dados de entrada
- **Rate Limiting**: Proteção contra spam
- **Webhook Security**: Verificação de assinatura
- **Opt-out**: Sistema de descadastro automático

## 📈 Monitoramento

- **Logs**: Estruturados com Pino
- **Health Check**: `/health` endpoint
- **Métricas**: Dashboard com indicadores
- **Filas**: Monitoramento de jobs

## 🚀 Deploy

### Vercel (Frontend)
1. Conecte o repositório
2. Configure as variáveis de ambiente
3. Deploy automático

### Railway/Render (Backend)
1. Conecte o repositório
2. Configure PostgreSQL e Redis
3. Configure as variáveis de ambiente
4. Deploy automático

### Docker Production
```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentação da API

### Endpoints Principais

#### WhatsApp
- `GET /api/wa/webhook` - Verificação do webhook
- `POST /api/wa/webhook` - Recebimento de eventos
- `POST /api/wa/send` - Envio de mensagens
- `POST /api/wa/send-template` - Envio de templates

#### Contatos
- `GET /api/contacts` - Listar contatos
- `POST /api/contacts` - Criar contato
- `PUT /api/contacts/:id` - Atualizar contato

#### Conversas
- `GET /api/conversations` - Listar conversas
- `POST /api/conversations/:id/messages` - Enviar mensagem

#### Pipeline
- `GET /api/pipeline/deals` - Listar negócios
- `POST /api/pipeline/deals` - Criar negócio
- `PUT /api/pipeline/deals/:id/move` - Mover negócio

## 🧪 Testes

### Testes Unitários
```bash
# Backend
npm run test

# Frontend
npm run test
```

### Testes E2E
```bash
# Backend
npm run test:e2e
```

### Testes de Integração WhatsApp
```bash
# Simular webhook
curl -X POST http://localhost:4000/api/wa/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[...]}'
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [Link para docs]
- **Issues**: [GitHub Issues]
- **Discord**: [Link para comunidade]

## 🔗 Links Úteis

- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Next.js 14](https://nextjs.org/docs)
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Desenvolvido com ❤️ para facilitar a gestão de relacionamento com clientes via WhatsApp**

