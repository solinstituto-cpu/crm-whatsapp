# Configuração para Deploy (Vercel + Render)

Use estes valores nas variáveis de ambiente de cada plataforma.

---

## ⚠️ IMPORTANTE: Connection Pooler para Render

O Render **não consegue** conectar na porta 5432 (conexão direta) do Supabase. Use a **porta 6543** (Connection Pooler) que suporta IPv4.

---

## Vercel (Web - tela branca de login)

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:Kurosaki7447%40%24%23@db.zrtnrcwfprwfedtuvscl.supabase.co:5432/postgres` |
| `NEXTAUTH_URL` | `https://crm-drm-nuyq.vercel.app` (ou a URL exata do seu deploy) |
| `NEXTAUTH_SECRET` | Uma string aleatória (ex: `openssl rand -hex 32`) |
| `API_URL` | `https://crm-drm.onrender.com` |

---

## Render (API) - USE PORTA 6543

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:Kurosaki7447%40%24%23@db.zrtnrcwfprwfedtuvscl.supabase.co:6543/postgres?pgbouncer=true` |
| `WEBAPP_URL` | `https://crm-drm-nuyq.vercel.app` |
| `API_URL` | `https://crm-drm.onrender.com` |
| `NODE_ENV` | `production` |
| `REDIS_URL` | Sua URL do Redis (se usar) |

### Start Command no Render

Use o caminho correto (NestJS compila para `dist/src/main.js`):

```
node dist/src/main.js
```

**Ou** se o Root Directory for `api`:
```
npm run start:prod
```

As migrations já foram aplicadas localmente. Não inclua `prisma migrate deploy` no Start Command.

---

## ⚠️ Erros comuns no DATABASE_URL

- **Usuário e senha:** `postgres:Kurosaki7447%40%24%23` (dois pontos `:` entre usuário e senha)
- **Host:** `db.zrtnrcwfprwfedtuvscl.supabase.co` (não `adb`, não `zrtnrow`)
- **Porta:** `5432` (não 6432)

**Formato correto:**
```
postgresql://postgres:Kurosaki7447%40%24%23@db.zrtnrcwfprwfedtuvscl.supabase.co:5432/postgres
```

---

## ⚠️ WEBAPP_URL no Render

Deve incluir `https://`:
- ✅ Correto: `https://crm-drm-nuyq.vercel.app`
- ❌ Errado: `crm-drm-nuyq.vercel.app`
