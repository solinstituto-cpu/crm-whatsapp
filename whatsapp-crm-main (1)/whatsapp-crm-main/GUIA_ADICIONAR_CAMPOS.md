# 📋 Guia para Adicionar Campos no CRM

Este documento mapeia todos os arquivos que precisam ser alterados para adicionar novos campos ao sistema.

---

## 🗂️ CONTATOS (Contact)

### 1. Schema do Banco de Dados
**Arquivo:** `apps/api/prisma/schema.prisma`
**Localização:** Linha ~37 (model Contact)

```prisma
model Contact {
  id            String    @id @default(cuid())
  name          String
  phoneE164     String    @unique
  email         String?
  company       String?
  role          String?   // Cargo/função
  notes         String?   // Notas/observações
  tags          String    // JSON string for tags array
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  // exemplo: birthday     DateTime?
  // exemplo: address      String?
  // exemplo: cpf          String?
  ...
}
```

### 2. Migration do Banco
**Criar arquivo:** `apps/api/prisma/migrations/YYYYMMDDHHMMSS_nome_descritivo/migration.sql`

```sql
-- Exemplo de migration
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "novo_campo" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "data_campo" TIMESTAMP;
```

### 3. Schema de Validação (Zod)
**Arquivo:** `apps/api/src/common/schemas.ts`
**Localização:** Linha ~17 (CreateContactSchema)

```typescript
export const CreateContactSchema = z.object({
  name: z.string().min(1),
  phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  // exemplo: birthday: z.string().optional().nullable(),
  // exemplo: cpf: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});
```

### 4. Service de Contatos (Backend)
**Arquivo:** `apps/api/src/contacts/contacts.service.ts`
**Localização:** Método `create()` linha ~11

```typescript
async create(createContactDto: CreateContactDto) {
  const data: any = {
    name: createContactDto.name,
    phoneE164: createContactDto.phoneE164,
    email: createContactDto.email || null,
    company: createContactDto.company || null,
    role: createContactDto.role || null,
    notes: createContactDto.notes || null,
    // 👉 ADICIONAR NOVOS CAMPOS AQUI
    // exemplo: birthday: createContactDto.birthday || null,
    tags: createContactDto.tags ? JSON.stringify(createContactDto.tags) : '[]',
  };
  ...
}
```

### 5. Interface TypeScript (Frontend)
**Arquivo:** `apps/web/src/app/contacts/page.tsx`
**Localização:** Linha ~19 (interface Contact)

```typescript
interface Contact {
  id: string
  name: string
  phoneE164: string
  email?: string
  company?: string
  role?: string
  notes?: string
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  // exemplo: birthday?: string
  // exemplo: cpf?: string
  tags: string[]
  optedOut: boolean
  lastMessageAt: string
  createdAt: string
}
```

### 6. Estado do Formulário (Frontend)
**Arquivo:** `apps/web/src/app/contacts/page.tsx`
**Localização:** Linha ~37 (useState formData)

```typescript
const [formData, setFormData] = useState({
  name: '',
  phoneE164: '',
  email: '',
  company: '',
  role: '',
  notes: '',
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  // exemplo: birthday: '',
  // exemplo: cpf: '',
  tags: [] as string[]
})
```

### 7. Handlers de Modal (Frontend)
**Arquivo:** `apps/web/src/app/contacts/page.tsx`
**Localização:** Função `handleOpenModal()` linha ~80

```typescript
// Ao editar contato:
setFormData({
  name: contact.name,
  phoneE164: contact.phoneE164,
  email: contact.email || '',
  company: contact.company || '',
  role: contact.role || '',
  notes: contact.notes || '',
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  tags: contact.tags || []
})

// Ao criar novo:
setFormData({
  name: '',
  phoneE164: '',
  email: '',
  company: '',
  role: '',
  notes: '',
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  tags: []
})
```

### 8. handleCloseModal (Frontend)
**Arquivo:** `apps/web/src/app/contacts/page.tsx`
**Localização:** Função `handleCloseModal()` linha ~103

```typescript
setFormData({ 
  name: '', 
  phoneE164: '', 
  email: '', 
  company: '', 
  role: '', 
  notes: '', 
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  tags: [] 
})
```

### 9. Payload de Envio (Frontend)
**Arquivo:** `apps/web/src/app/contacts/page.tsx`
**Localização:** Função `handleSaveContact()` linha ~137

```typescript
const payload = {
  name: formData.name,
  phoneE164: phone,
  email: formData.email || null,
  company: formData.company || null,
  role: formData.role || null,
  notes: formData.notes || null,
  // 👉 ADICIONAR NOVOS CAMPOS AQUI
  tags: formData.tags
}
```

### 10. JSX do Formulário Modal (Frontend)
**Arquivo:** `apps/web/src/app/contacts/page.tsx`
**Localização:** Dentro do modal, após os campos existentes (~linha 400)

```tsx
{/* Exemplo de novo campo */}
<div>
  <label className="block text-sm font-medium mb-1">Novo Campo</label>
  <input
    type="text"
    value={formData.novoCampo}
    onChange={(e) => setFormData({ ...formData, novoCampo: e.target.value })}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
    placeholder="Placeholder"
  />
</div>
```

---

## 💬 CONVERSAS (Conversation)

### Schema do Banco
**Arquivo:** `apps/api/prisma/schema.prisma`
**Localização:** model Conversation (~linha 62)

### Service
**Arquivo:** `apps/api/src/conversations/conversations.service.ts`

### Controller
**Arquivo:** `apps/api/src/conversations/conversations.controller.ts`

### Frontend
**Arquivo:** `apps/web/src/app/inbox/page.tsx`

---

## 📝 MENSAGENS (Message)

### Schema do Banco
**Arquivo:** `apps/api/prisma/schema.prisma`
**Localização:** model Message (~linha 78)

### Webhook Service
**Arquivo:** `apps/api/src/whatsapp/webhook.service.ts`

---

## 🔧 PROCESSO PARA ADICIONAR CAMPO

### Passo a Passo:

1. **Prisma Schema** - Adicionar campo no model
2. **Criar Migration** - SQL para alterar tabela
3. **Zod Schema** - Adicionar validação
4. **Backend Service** - Adicionar no create/update
5. **Frontend Interface** - Adicionar no TypeScript
6. **Frontend State** - Adicionar no useState
7. **Frontend Handlers** - Adicionar nos handlers
8. **Frontend Form** - Adicionar input no JSX
9. **Git Commit** - Commitar alterações
10. **Deploy Render** - Fazer deploy
11. **Rodar Migration** - `npx prisma migrate deploy`

---

## 📁 ESTRUTURA DE ARQUIVOS

```
apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma          👈 Schema do banco
│   │   └── migrations/            👈 Migrations SQL
│   └── src/
│       ├── common/
│       │   └── schemas.ts         👈 Validação Zod
│       ├── contacts/
│       │   ├── contacts.controller.ts
│       │   └── contacts.service.ts 👈 Lógica de negócio
│       ├── conversations/
│       │   ├── conversations.controller.ts
│       │   └── conversations.service.ts
│       └── whatsapp/
│           ├── webhook.service.ts
│           └── whatsapp.service.ts
└── web/
    └── src/
        └── app/
            ├── contacts/
            │   └── page.tsx       👈 Página de contatos
            └── inbox/
                └── page.tsx       👈 Página de inbox
```

---

## 🎯 CAMPOS SUGERIDOS PARA FUTURO

### Contatos:
- `birthday` (DateTime) - Data de nascimento
- `cpf` (String) - CPF/Documento
- `address` (String) - Endereço
- `city` (String) - Cidade
- `state` (String) - Estado
- `cep` (String) - CEP
- `instagram` (String) - @ do Instagram
- `source` (String) - Origem do lead (site, indicação, etc)
- `value` (Decimal) - Valor potencial do cliente
- `priority` (String) - Prioridade (alta, média, baixa)

### Conversas:
- `assignedToId` (String) - Atendente responsável
- `priority` (String) - Prioridade
- `category` (String) - Categoria

---

*Documento criado em: 21/01/2026*
*Última atualização: 21/01/2026*
