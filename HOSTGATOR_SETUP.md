# 🚀 CONFIGURAÇÃO PARA PRODUÇÃO - HOSTGATOR

## 📋 VARIÁVEIS DE AMBIENTE (.env)

### 🗄️ BANCO DE DADOS POSTGRESQL (HOSTGATOR)
```env
# PostgreSQL no Hostgator (RECOMENDADO)
DATABASE_URL="postgresql://usuario:senha@host:5432/database_name"

# Exemplo real:
# DATABASE_URL="postgresql://crmuser:suasenha123@postgres.hostgator.com.br:5432/crm_whatsapp"
```

### 🗄️ ALTERNATIVA MYSQL (HOSTGATOR)
```env
# Se preferir MySQL (também incluído no Hostgator)
DATABASE_URL="mysql://usuario:senha@host:3306/database_name"

# Exemplo real:
# DATABASE_URL="mysql://crmuser:suasenha123@mysql.hostgator.com.br:3306/crm_whatsapp"
```

### 🔐 AUTENTICAÇÃO
```env
# JWT Secret - GERE UMA NOVA CHAVE FORTE PARA PRODUÇÃO
JWT_SECRET="sua-chave-jwt-super-segura-para-producao-123456789"

# NextAuth
NEXTAUTH_SECRET="sua-chave-nextauth-super-segura-para-producao-987654321"
NEXTAUTH_URL="https://seudominio.com.br"
API_URL="https://seudominio.com.br/api"
```

### 📱 WHATSAPP API
```env
# Credenciais da Meta Business API
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_VERIFY_TOKEN="meuTokenSeguro123"
WHATSAPP_WEBHOOK_URL="https://seudominio.com.br/api/wa/webhook"
```

### 🚀 REDIS (OPCIONAL - PARA FILAS)
```env
# Se você contratar Redis no Hostgator ou usar Redis Cloud gratuito
REDIS_URL="redis://usuario:senha@host:6379"

# Redis Cloud gratuito (recomendado)
# REDIS_URL="redis://default:senha@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345"
```

### 🌍 PRODUÇÃO
```env
NODE_ENV="production"
PORT="3000"
```

---

## 🏭 CONFIGURAÇÃO HOSTGATOR

### 1. 📊 BANCO DE DADOS
**Opção A - PostgreSQL (RECOMENDADO):**
- Acesse cPanel → PostgreSQL Databases
- Crie database: `crm_whatsapp`
- Crie usuário e senha
- Anote host: `postgres.seudominio.com.br`

**Opção B - MySQL:**
- Acesse cPanel → MySQL Databases  
- Crie database: `crm_whatsapp`
- Crie usuário e senha
- Anote host: `mysql.seudominio.com.br`

### 2. 🚀 DEPLOY

**Estrutura de arquivos no Hostgator:**
```
public_html/
├── api/ (backend build)
├── _next/ (frontend build)
├── package.json
└── .env
```

### 3. 📁 SCRIPTS DE BUILD PARA PRODUÇÃO

**package.json atualizado:**
```json
{
  "scripts": {
    "build": "npm run build:api && npm run build:web",
    "build:api": "cd apps/api && npm run build",
    "build:web": "cd apps/web && npm run build",
    "start": "npm run start:api & npm run start:web",
    "start:api": "cd apps/api && npm run start:prod",
    "start:web": "cd apps/web && npm run start",
    "postinstall": "npm run prisma:generate",
    "prisma:generate": "cd apps/api && npx prisma generate",
    "prisma:deploy": "cd apps/api && npx prisma migrate deploy"
  }
}
```

---

## 🔄 PROCESSO DE DEPLOY

### 1. **PREPARAR CÓDIGO**
```bash
# Buildar para produção
npm run build

# Gerar cliente Prisma
npm run prisma:generate
```

### 2. **SUBIR PARA HOSTGATOR**
```bash
# Via FTP ou File Manager do cPanel
# Copiar arquivos buildados para public_html/
```

### 3. **CONFIGURAR BANCO**
```bash
# Rodar migrations na produção
npm run prisma:deploy

# Popular com dados iniciais
npm run seed:prod
```

### 4. **TESTAR**
- Acesse: https://seudominio.com.br
- Teste login: admin@crm.com / admin123

---

## 🛠️ VANTAGENS DA CONFIGURAÇÃO ATUAL

### ✅ **PostgreSQL no Hostgator**
- ✅ **Gratuito** no plano de hospedagem
- ✅ **Melhor para CRM** (relacionamentos complexos)
- ✅ **JSON nativo** (melhor que MySQL para dados flexíveis)
- ✅ **Escalável** (suporta milhares de contatos)
- ✅ **Backup automático** do Hostgator

### ✅ **Estrutura Atual**
- ✅ **Já preparado** para PostgreSQL
- ✅ **Fallback SQLite** para desenvolvimento
- ✅ **Environment variables** configuradas
- ✅ **Migrações automáticas** Prisma
- ✅ **Seeds incluídos** para dados iniciais

### ✅ **Deploy Hostgator**
- ✅ **Node.js nativo** (Hostgator suporta)
- ✅ **Next.js otimizado** para produção
- ✅ **Static files** servidos corretamente
- ✅ **API routes** funcionais
- ✅ **Environment** isolado

---

## 🚨 CHECKLIST DE PRODUÇÃO

### Antes do Deploy:
- [ ] Gerar JWT_SECRET forte
- [ ] Configurar DATABASE_URL do Hostgator
- [ ] Configurar NEXTAUTH_URL com domínio real
- [ ] Testar conexão banco de dados
- [ ] Buildar aplicação completa
- [ ] Configurar WhatsApp webhook URL

### Após Deploy:
- [ ] Testar login funcionando
- [ ] Verificar banco de dados populado
- [ ] Testar todas as páginas
- [ ] Configurar SSL (HTTPS)
- [ ] Testar webhook WhatsApp
- [ ] Configurar backups regulares

---

**🎯 COM ESSA CONFIGURAÇÃO SEU CRM FUNCIONARÁ PERFEITAMENTE NO HOSTGATOR!**

*A estrutura já está otimizada para produção e evitará problemas futuros de migração.*