# ✅ Checklist de Deploy Completo

## 🎯 Objetivo
Migrar do ambiente local (SQLite) para produção (PostgreSQL + Render + Vercel)

## 📋 Status Atual
- [x] ✅ WhatsApp funcionando localmente
- [x] ✅ PostgreSQL local configurado  
- [x] ✅ Migração de dados completa
- [x] ✅ API rodando com PostgreSQL
- [x] ✅ Arquivos de deploy criados

## 🚀 Próximos Passos

### 1. Render (Backend) - PRIORIDADE 1
- [ ] Criar conta no Render.com
- [ ] Criar PostgreSQL Database ($7/mês)
- [ ] Criar Web Service ($7/mês)  
- [ ] Configurar variáveis de ambiente
- [ ] Testar API de produção
- [ ] **Arquivo de ajuda**: `RENDER_DEPLOY_GUIDE.md`

### 2. Vercel (Frontend) - PRIORIDADE 2
- [ ] Criar conta no Vercel.com
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Deploy da aplicação Next.js
- [ ] Testar login e navegação
- [ ] **Arquivo de ajuda**: `VERCEL_DEPLOY_GUIDE.md`

### 3. Webhook (Meta) - PRIORIDADE 3
- [ ] Configurar webhook no Meta App
- [ ] Apontar para URL do Render
- [ ] Testar recebimento de mensagens
- [ ] Validar fluxo completo
- [ ] **Arquivo de ajuda**: `WEBHOOK_PRODUCTION_GUIDE.md`

## 📁 Arquivos Criados para Deploy

### Backend (Render):
- ✅ `apps/api/render.yaml` - Configuração automática
- ✅ `apps/api/Dockerfile.render` - Container otimizado
- ✅ `apps/api/package.json` - Scripts atualizados
- ✅ `RENDER_DEPLOY_GUIDE.md` - Guia passo-a-passo

### Frontend (Vercel):
- ✅ `apps/web/vercel.json` - Configuração do Vercel
- ✅ `VERCEL_DEPLOY_GUIDE.md` - Guia passo-a-passo

### Webhook:
- ✅ `WEBHOOK_PRODUCTION_GUIDE.md` - Configuração Meta

## 💰 Custos Mensais

```
Render PostgreSQL: $7/mês
Render Web Service: $7/mês
Vercel Hobby: GRÁTIS
-------------------
Total: $14/mês
```

## 🔧 Variáveis de Ambiente Necessárias

### Render (Backend):
```bash
DATABASE_URL=<internal database URL>
NODE_ENV=production
PORT=10000
JWT_SECRET=<gerar novo>
WHATSAPP_ACCESS_TOKEN=<seu token atual>
WHATSAPP_VERIFY_TOKEN=<seu verify token atual>  
WHATSAPP_BUSINESS_PHONE_ID=<seu phone ID atual>
WHATSAPP_API_VERSION=v22.0
WHATSAPP_API_BASE_URL=https://graph.facebook.com
```

### Vercel (Frontend):
```bash
NEXTAUTH_SECRET=<gerar novo>
NEXTAUTH_URL=https://seu-app.vercel.app
NEXT_PUBLIC_API_URL=https://crm-api-[hash].onrender.com
```

## 🎯 Ordem de Execução Recomendada

1. **Criar contas** (Render + Vercel)
2. **Deploy Backend** (Render)
3. **Testar API** de produção  
4. **Deploy Frontend** (Vercel)
5. **Configurar Webhook** (Meta)
6. **Teste final** completo

## 🆘 Suporte

Se algo der errado:
1. Verificar logs no Render/Vercel
2. Testar endpoints individualmente
3. Verificar variáveis de ambiente
4. Consultar guias específicos

## 🎉 Resultado Final

Após completar todos os passos:
- ✅ API rodando 24/7 no Render
- ✅ Frontend acessível via Vercel  
- ✅ WhatsApp recebendo/enviando mensagens
- ✅ Dados salvos no PostgreSQL
- ✅ Sistema totalmente em produção