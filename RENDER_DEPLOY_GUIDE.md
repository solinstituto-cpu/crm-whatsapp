# 🚀 Deploy no Render - Guia Completo

## 📋 Pré-requisitos
- [ ] Conta criada no Render.com
- [ ] Repositório GitHub/GitLab conectado
- [ ] Tokens do WhatsApp configurados

## 🗄️ 1. Criar PostgreSQL Database

### No Dashboard do Render:
1. Clique em "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `crm-postgres`
   - **Database**: `crm_db` 
   - **User**: `crm_user`
   - **Region**: Oregon (mais barato)
   - **Plan**: Starter ($7/mês)

3. Clique "Create Database"
4. **IMPORTANTE**: Salve a "Internal Database URL" que aparecerá

## 🌐 2. Criar Web Service

### No Dashboard do Render:
1. Clique em "New +" → "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `crm-api`
   - **Region**: Oregon (mesmo da DB)
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build && npm run migrate:prod`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Starter ($7/mês)

## ⚙️ 3. Variáveis de Ambiente

### No Web Service → Environment:
```bash
# Database
DATABASE_URL=<Internal Database URL copiada do passo 1>

# Node
NODE_ENV=production
PORT=10000

# JWT (gerar novo secret)
JWT_SECRET=<gerar um token seguro de 32+ caracteres>

# WhatsApp (seus tokens atuais)
WHATSAPP_ACCESS_TOKEN=<seu token atual>
WHATSAPP_VERIFY_TOKEN=<seu verify token atual>
WHATSAPP_BUSINESS_PHONE_ID=<seu phone ID atual>
WHATSAPP_API_VERSION=v22.0
WHATSAPP_API_BASE_URL=https://graph.facebook.com
```

## 🔧 4. Como gerar JWT_SECRET seguro:

```bash
# Opção 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opção 2: Online
# Acesse: https://generate-secret.vercel.app/32
```

## 🚀 5. Deploy

1. Clique "Create Web Service"
2. Aguarde o build (5-10 minutos)
3. Se der erro, verifique os logs em "Logs"

## ✅ 6. Verificar Deploy

Após o deploy, sua API estará em:
```
https://crm-api-[seu-hash].onrender.com
```

### Testar endpoints:
```bash
# Health check
GET https://crm-api-[seu-hash].onrender.com/api/wa/health

# Debug da conta
GET https://crm-api-[seu-hash].onrender.com/api/wa/debug/account
```

## 🔄 7. Configurar Auto-Deploy

No Web Service → Settings → Build & Deploy:
- [x] Auto-Deploy: Yes

Agora toda vez que você fizer push para `main`, será feito deploy automático.

## 💰 Custos

- **PostgreSQL Starter**: $7/mês
- **Web Service Starter**: $7/mês
- **Total**: $14/mês

## 🐛 Troubleshooting

### Build falha:
- Verificar se `npm run migrate:prod` está funcionando
- Verificar se todas as variáveis estão configuradas
- Verificar logs em "Logs"

### Database não conecta:
- Verificar se DATABASE_URL está correto
- Verificar se database e web service estão na mesma região

### WhatsApp não funciona:
- Verificar tokens em Environment
- Testar endpoint `/api/wa/debug/account`
- Verificar logs da aplicação