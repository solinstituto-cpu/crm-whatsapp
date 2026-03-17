# Setup do banco direto no Supabase

Se o terminal não funcionar, você pode rodar o SQL direto no Supabase.

---

## Se o banco está incompleto ou com problemas: ZERAR E RECRIAR

### Passo 1: Zerar o banco
1. Abra `SUPABASE-RESET-COMPLETO.sql`
2. Copie e execute no SQL Editor do Supabase
3. Isso apaga **todas** as tabelas e dados

### Passo 2: Criar tabelas
1. Abra `SUPABASE-SCHEMA.sql`
2. Copie **todo** o conteúdo
3. Cole no SQL Editor (nova query) e execute

### Passo 3: Inserir usuários
1. Abra `SUPABASE-SEED.sql`
2. Copie **todo** o conteúdo
3. Cole no SQL Editor (nova query) e execute

---

## Se o banco já está vazio (primeira vez)

1. Execute `SUPABASE-SCHEMA.sql`
2. Execute `SUPABASE-SEED.sql`

---

## Credenciais de login

| Email | Senha |
|-------|-------|
| admin@crm.com | admin123 |
| agent@crm.com | agent123 |
| deni.morais777@gmail.com | deni123 |

---

## Arquivos

| Arquivo | O que faz |
|---------|-----------|
| `SUPABASE-RESET-COMPLETO.sql` | Zera o banco (apaga tudo) |
| `SUPABASE-SCHEMA.sql` | Cria todas as tabelas |
| `SUPABASE-SEED.sql` | Insere os usuários |
