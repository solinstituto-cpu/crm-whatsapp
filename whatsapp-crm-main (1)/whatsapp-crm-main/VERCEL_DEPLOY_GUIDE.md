# 🚀 Deploy no Vercel - Guia Completo

## 📋 Pré-requisitos
- [ ] Conta criada no Vercel.com
- [ ] API já deployada no Render
- [ ] URL da API de produção

## 🌐 1. Criar Projeto no Vercel

### No Dashboard do Vercel:
1. Clique "Add New..." → "Project"
2. Conecte seu repositório GitHub
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

## ⚙️ 2. Variáveis de Ambiente

### No Projeto → Settings → Environment Variables:

```bash
# NextAuth
NEXTAUTH_SECRET=<gerar um token seguro de 32+ caracteres>
NEXTAUTH_URL=https://seu-app.vercel.app

# API Backend (URL do Render)
NEXT_PUBLIC_API_URL=https://crm-api-[seu-hash].onrender.com
```

## 🔧 3. Como gerar NEXTAUTH_SECRET:

```bash
# Opção 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opção 2: OpenSSL
openssl rand -base64 32

# Opção 3: Online
# Acesse: https://generate-secret.vercel.app/32
```

## 📝 4. Atualizar .env.local para desenvolvimento

Após deploy, atualize seu arquivo local:

```bash
# .env.local (desenvolvimento)
NEXTAUTH_SECRET=<mesmo secret usado no Vercel>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🚀 5. Deploy

1. Clique "Deploy"
2. Aguarde o build (3-5 minutos)
3. Se der erro, verifique os logs

## ✅ 6. Verificar Deploy

Após o deploy, seu app estará em:
```
https://seu-app.vercel.app
```

### Testar funcionalidades:
1. Login com admin@crm.com / admin123
2. Navegar pelas páginas
3. Testar conexão com API

## 🔄 7. Configurar Auto-Deploy

O Vercel já vem com auto-deploy configurado:
- Push para `main` = deploy automático
- Pull requests = preview deployments

## 🔧 8. Configurações Adicionais

### No Projeto → Settings:

**Build & Development Settings:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`

**Functions:**
- Region: Washington, D.C. (iad1) - próximo ao Render Oregon
- Timeout: 30s (APIs podem demorar)

## 🌍 9. Domínio Personalizado (Opcional)

### Se você tem um domínio:
1. Settings → Domains
2. Add domain: `seudominio.com`
3. Configure DNS conforme instruções
4. Atualizar NEXTAUTH_URL para seu domínio

## 💰 Custos

- **Vercel Hobby**: GRÁTIS
- **Vercel Pro** (se precisar): $20/mês
- **Total recomendado**: $0

## 🐛 Troubleshooting

### Build falha:
- Verificar se `npm run build` funciona localmente
- Verificar se todas as variáveis estão configuradas
- Verificar erros TypeScript

### App não carrega:
- Verificar se NEXT_PUBLIC_API_URL está correto
- Testar URL da API manualmente
- Verificar logs no Vercel

### Login não funciona:
- Verificar NEXTAUTH_SECRET e NEXTAUTH_URL
- Verificar se API está respondendo
- Verificar credenciais admin@crm.com

### API não conecta:
- Verificar se Render está rodando
- Testar endpoints da API diretamente
- Verificar CORS se necessário