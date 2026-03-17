# 📱 Plano de Implementação: Multi-Números WhatsApp

## 🎯 Objetivo
Permitir que o sistema gerencie múltiplos números de WhatsApp Business, com possibilidade de alternar entre eles e manter conversas separadas por número.

---

## 📌 CHECKPOINT DE SEGURANÇA
- **Tag:** `v1.0-stable`
- **Data:** 04/02/2026
- **Como reverter:** `git checkout v1.0-stable`

---

## 🏗️ ARQUITETURA PROPOSTA

### Conceito Principal
- Cada "número" será uma **WhatsAppAccount** (conta)
- Cada conta terá seu próprio `accessToken`, `phoneNumberId`, `businessId`
- As conversas serão vinculadas a uma conta específica
- O usuário poderá alternar entre contas no topo da Inbox

### Fluxo do Usuário
1. Admin cadastra novas contas em **Configurações > WhatsApp API**
2. No **Inbox**, aparece um seletor de conta no topo
3. Ao selecionar uma conta, carrega apenas conversas daquele número
4. Mensagens são enviadas usando as credenciais da conta selecionada
5. Webhook identifica qual conta recebeu a mensagem pelo `phoneNumberId`

---

## 📊 MUDANÇAS NO BANCO DE DADOS

### Nova Tabela: `WhatsAppAccount`
```prisma
model WhatsAppAccount {
  id              String   @id @default(cuid())
  name            String   // "Comercial", "Suporte", etc.
  phoneNumber     String   // +5511999999999
  phoneNumberId   String   @unique // ID do Meta
  businessId      String   // WABA ID
  accessToken     String   // Token de acesso (criptografado)
  webhookVerifyToken String @default("sol_verify_token")
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false) // Conta padrão
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relações
  conversations   Conversation[]
  campaigns       Campaign[]
  
  @@map("whatsapp_accounts")
}
```

### Alterações em Tabelas Existentes

#### `Conversation`
```prisma
// ADICIONAR:
whatsappAccountId String?
whatsappAccount   WhatsAppAccount? @relation(fields: [whatsappAccountId], references: [id])
```

#### `Campaign`
```prisma
// ADICIONAR:
whatsappAccountId String?
whatsappAccount   WhatsAppAccount? @relation(fields: [whatsappAccountId], references: [id])
```

#### `Message`
```prisma
// ADICIONAR (opcional, para rastreabilidade):
phoneNumberId     String? // De qual número foi enviado/recebido
```

---

## 📁 MUDANÇAS POR ARQUIVO/MÓDULO

### 1. PRISMA SCHEMA
**Arquivo:** `apps/api/prisma/schema.prisma`
- [ ] Criar model `WhatsAppAccount`
- [ ] Adicionar `whatsappAccountId` em `Conversation`
- [ ] Adicionar `whatsappAccountId` em `Campaign`
- [ ] Criar migration

### 2. BACKEND - NOVO MÓDULO: WhatsApp Accounts
**Arquivos novos:**
- [ ] `apps/api/src/whatsapp-accounts/whatsapp-accounts.module.ts`
- [ ] `apps/api/src/whatsapp-accounts/whatsapp-accounts.service.ts`
- [ ] `apps/api/src/whatsapp-accounts/whatsapp-accounts.controller.ts`

**Endpoints:**
- `GET /api/whatsapp-accounts` - Listar contas
- `POST /api/whatsapp-accounts` - Criar conta
- `PUT /api/whatsapp-accounts/:id` - Atualizar conta
- `DELETE /api/whatsapp-accounts/:id` - Remover conta
- `POST /api/whatsapp-accounts/:id/set-default` - Definir padrão

### 3. BACKEND - CONVERSATIONS
**Arquivo:** `apps/api/src/conversations/conversations.service.ts`
- [ ] Adicionar filtro por `whatsappAccountId` no `findAll`
- [ ] Ao criar conversa, associar à conta correta
- [ ] Incluir `whatsappAccount` nos includes

**Arquivo:** `apps/api/src/conversations/conversations.controller.ts`
- [ ] Adicionar query param `accountId` no GET /conversations

### 4. BACKEND - WHATSAPP (envio/recebimento)
**Arquivo:** `apps/api/src/whatsapp/whatsapp.service.ts`
- [ ] Método `sendMessage` deve receber `accountId` e buscar credenciais da conta
- [ ] Remover uso de variáveis de ambiente fixas
- [ ] Criar método `getAccountCredentials(accountId)`

**Arquivo:** `apps/api/src/whatsapp/whatsapp.controller.ts` (webhook)
- [ ] No webhook, identificar conta pelo `phoneNumberId` recebido
- [ ] Associar mensagem/conversa à conta correta

### 5. BACKEND - CAMPAIGNS
**Arquivo:** `apps/api/src/campaigns/campaigns.service.ts`
- [ ] Adicionar `whatsappAccountId` na criação
- [ ] Usar credenciais da conta ao enviar

### 6. BACKEND - SETTINGS
**Arquivo:** `apps/api/src/settings/settings.controller.ts`
- [ ] Manter compatibilidade com sistema atual (migrar config existente para primeira conta)

### 7. FRONTEND - INBOX
**Arquivo:** `apps/web/src/app/inbox/page.tsx`
- [ ] Adicionar estado `selectedAccountId`
- [ ] Adicionar seletor de conta no topo (dropdown ou tabs)
- [ ] Filtrar conversas por conta selecionada
- [ ] Passar `accountId` ao enviar mensagens
- [ ] Carregar contas disponíveis

### 8. FRONTEND - CONFIGURAÇÕES
**Arquivo:** `apps/web/src/app/settings/page.tsx`
- [ ] Transformar tab "WhatsApp API" em lista de contas
- [ ] Modal para adicionar/editar conta
- [ ] Indicador visual de conta padrão
- [ ] Botão para testar conexão de cada conta

### 9. FRONTEND - CAMPANHAS
**Arquivo:** `apps/web/src/app/campanhas/page.tsx`
- [ ] Seletor de conta ao criar campanha
- [ ] Mostrar de qual conta é cada campanha

### 10. FRONTEND - AUTOMAÇÃO
**Arquivo:** `apps/web/src/app/automacao/page.tsx`
- [ ] Fluxos vinculados a conta específica ou todas

---

## ⚠️ RISCOS E COMPLEXIDADES

### Alta Complexidade
1. **Webhook compartilhado**: O mesmo endpoint recebe de todos os números
   - Solução: Identificar pelo `phoneNumberId` no payload

2. **Migração de dados existentes**: Conversas atuais não têm `whatsappAccountId`
   - Solução: Migration que cria conta padrão e associa tudo a ela

3. **Variáveis de ambiente**: Sistema atual usa `.env` para credenciais
   - Solução: Manter `.env` como fallback, priorizar banco

### Média Complexidade
4. **Templates**: Templates são por WABA, não por número
   - Solução: Buscar templates da conta selecionada

5. **Performance**: Mais JOINs nas queries
   - Solução: Índices adequados no banco

6. **UX de alternância**: Usuário pode confundir qual número está usando
   - Solução: Indicador visual claro e persistente

### Baixa Complexidade
7. **Testes**: Precisará testar com múltiplos números
8. **Documentação**: Atualizar guias de setup

---

## 🔄 ESTRATÉGIA DE MIGRAÇÃO

### Fase 1: Preparação (sem breaking changes)
1. Criar tabela `WhatsAppAccount`
2. Criar conta padrão com dados do `.env` atual
3. Adicionar campo `whatsappAccountId` (nullable) nas tabelas
4. Backend aceita ambos (com e sem accountId)

### Fase 2: Migração de Dados
1. Associar todas as conversas existentes à conta padrão
2. Associar campanhas à conta padrão

### Fase 3: Interface
1. Adicionar seletor de conta no Inbox
2. Adicionar gerenciamento de contas nas Configurações

### Fase 4: Consolidação
1. Tornar `whatsappAccountId` obrigatório
2. Remover fallback para `.env`
3. Testes completos

---

## 🎨 UX/UI PROPOSTA

### Inbox - Seletor de Conta
```
┌─────────────────────────────────────────┐
│ 📱 Comercial ▼        │ 🔍 Buscar...   │
├─────────────────────────────────────────┤
│ ┌─────────────────┐                     │
│ │ 📱 Comercial ✓  │                     │
│ │ 📱 Suporte      │                     │
│ │ 📱 Vendas       │                     │
│ │ ───────────────│                     │
│ │ ⚙️ Gerenciar    │                     │
│ └─────────────────┘                     │
```

### Configurações - WhatsApp Accounts
```
┌─────────────────────────────────────────────────┐
│ 📱 Contas WhatsApp                    + Nova    │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 📱 Comercial          +55 11 99999-9999     │ │
│ │    ● Padrão           ✅ Conectado          │ │
│ │                       [Editar] [Testar]     │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📱 Suporte            +55 11 88888-8888     │ │
│ │                       ✅ Conectado          │ │
│ │                       [Editar] [Testar]     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 📋 ORDEM DE IMPLEMENTAÇÃO

### Sprint 1: Backend Core
1. Schema Prisma + Migration
2. Módulo WhatsAppAccounts (CRUD)
3. Adaptar WhatsApp Service
4. Adaptar Webhook

### Sprint 2: Backend Integração
5. Adaptar Conversations
6. Adaptar Campaigns
7. Migration de dados existentes

### Sprint 3: Frontend
8. Configurações - Gerenciar Contas
9. Inbox - Seletor de Conta
10. Campanhas - Seletor de Conta

### Sprint 4: Testes e Polish
11. Testes end-to-end
12. Ajustes de UX
13. Documentação

---

## ✅ CHECKLIST PRÉ-IMPLEMENTAÇÃO

- [x] Checkpoint criado (tag v1.0-stable)
- [x] Plano documentado
- [x] Aprovação do plano
- [ ] Backup do banco de produção
- [ ] Ambiente de staging para testes

---

## 🚧 PROGRESSO DA IMPLEMENTAÇÃO

### Sprint 1: Backend Core ✅ COMPLETO
- [x] Schema Prisma + Migration (WhatsAppAccount, campos em Conversation e Campaign)
- [x] Módulo WhatsAppAccounts (CRUD) - Service e Controller criados
- [x] Adaptar WhatsApp Service para usar credenciais do banco
- [x] Adaptar Webhook para identificar conta pelo phoneNumberId

### Sprint 2: Backend Integração ⏳ EM ANDAMENTO
- [x] Adaptar Conversations para filtrar por accountId
- [ ] Adaptar Campaigns para usar conta específica
- [ ] Migration de dados existentes para conta padrão

### Sprint 3: Frontend
- [ ] Configurações - Gerenciar Contas WhatsApp
- [ ] Inbox - Seletor de Conta
- [ ] Campanhas - Seletor de Conta

### Sprint 4: Testes e Polish
- [ ] Testes end-to-end
- [ ] Ajustes de UX
- [ ] Documentação

---

## 🚀 PRÓXIMOS PASSOS

Após aprovação deste plano:
1. Iniciar Sprint 1
2. Cada sprint será um commit separado
3. Testes em staging antes de produção
4. Deploy gradual

---

**Criado em:** 04/02/2026
**Última atualização:** 04/02/2026
**Status:** AGUARDANDO APROVAÇÃO
