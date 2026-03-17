# Configuração para Deploy (Vercel + Render)

Projeto usa estrutura **monorepo** com `apps/api` e `apps/web`.

---

## Render (API)

### Configuração no Dashboard

| Configuração | Valor |
|--------------|-------|
| **Root Directory** | `apps/api` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/main.js` *(não use dist/src/main.js)* |

### Variáveis de Ambiente

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.zrtnrcwfprwfedtuvscl:Kurosaki7447%40%24%23@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `WEBAPP_URL` | `https://crm-drm-nuyq.vercel.app` |
| `API_URL` | `https://crm-drm.onrender.com` |
| `NODE_ENV` | `production` |
| `REDIS_URL` | Sua URL do Redis (se usar) |

---

## Vercel (Web)

### Configuração no Dashboard

| Configuração | Valor |
|--------------|-------|
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` (ou deixar automático) |
| **Output Directory** | `.next` (automático para Next.js) |

### Variáveis de Ambiente

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.zrtnrcwfprwfedtuvscl:Kurosaki7447%40%24%23@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `NEXTAUTH_URL` | `https://crm-drm-nuyq.vercel.app` (URL do seu deploy) |
| `NEXTAUTH_SECRET` | String aleatória |
| `API_URL` | `https://crm-drm.onrender.com` |

---

## Estrutura do Projeto

```
crmDENI/
├── apps/
│   ├── api/     ← Render (Root Directory: apps/api)
│   └── web/     ← Vercel (Root Directory: apps/web)
├── package.json
├── render.yaml
└── vercel.json
```

---

## Primeiro Deploy

1. **Render:** Ajuste Root Directory para `apps/api` e as variáveis
2. **Vercel:** Ajuste Root Directory para `apps/web` e as variáveis
3. Faça push para o repositório conectado
