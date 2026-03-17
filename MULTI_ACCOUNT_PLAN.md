# Plano: Suporte a Múltiplos Números WhatsApp

## Objetivo
Permitir usar múltiplos números de WhatsApp no mesmo sistema, com conversas e configurações isoladas por número.

---

## 1. Estrutura do Banco de Dados

### Nova tabela: WhatsAppAccount
```prisma
model WhatsAppAccount {
  id              String   @id @default(cuid())
  name            String   // Nome amigável (ex: "Clínica Centro", "Clínica Sul")
  phoneNumber     String   // Número formatado para exibição
  phoneNumberId   String   // Phone Number ID da Meta
  businessAccountId String // Business Account ID
  accessToken     String   // Token de acesso (encriptado)
  verifyToken     String   // Token de verificação do webhook
  webhookSecret   String?  // Secret para validar webhooks
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false) // Conta padrão
  
  // Relacionamentos
  conversations   Conversation[]
  campaigns       Campaign[]
  flows           Flow[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Alterações em tabelas existentes
- `Conversation`: adicionar `accountId` (obrigatório)
- `Campaign`: adicionar `accountId` (obrigatório)
- `Flow`: adicionar `accountId` (obrigatório)
- `Contact`: pode ser compartilhado entre contas (sem accountId)

---

## 2. Backend

### WhatsApp Service
- Receber `accountId` em todos os métodos
- Buscar credenciais da conta específica
- Cache de tokens por conta

### Webhook
- Identificar qual conta recebeu a mensagem pelo `phone_number_id`
- Rotear para o serviço correto

### Endpoints
- `GET /api/accounts` - Listar contas
- `POST /api/accounts` - Criar conta
- `PATCH /api/accounts/:id` - Atualizar
- `DELETE /api/accounts/:id` - Remover
- `POST /api/accounts/:id/test` - Testar conexão

### Filtros
- Adicionar `?accountId=xxx` em todos endpoints que precisam filtrar

---

## 3. Frontend

### Seletor de Conta (Header/Sidebar)
- Dropdown com todas as contas ativas
- Salvar seleção no localStorage
- Contexto React para conta ativa

### Páginas afetadas
- **Inbox**: filtrar conversas pela conta
- **Campanhas**: criar/listar por conta
- **Automações**: configurar por conta
- **Configurações**: nova aba "Contas WhatsApp"

---

## 4. Migração

1. Criar tabela `WhatsAppAccount`
2. Criar conta padrão com credenciais atuais (.env)
3. Atualizar registros existentes com `accountId` da conta padrão
4. Tornar `accountId` obrigatório

---

## 5. Estimativa de Implementação

| Tarefa | Tempo Estimado |
|--------|----------------|
| Schema + Migration | 2h |
| Backend - CRUD contas | 2h |
| Backend - Filtros por conta | 3h |
| Webhook multi-conta | 2h |
| Frontend - Seletor | 2h |
| Frontend - Filtros | 2h |
| Testes | 2h |
| **Total** | **~15h (2 dias)** |

---

## 6. Considerações

### Segurança
- Tokens de acesso devem ser encriptados no banco
- Validar que usuário tem acesso à conta selecionada

### UX
- Indicador visual claro de qual conta está ativa
- Cor diferente para cada conta (opcional)
- Notificações separadas por conta

### Webhook
- Um único webhook pode receber de múltiplas contas
- Identificar pelo `phone_number_id` no payload

---

## Status: 📋 PLANEJADO
Aguardando implementação.
