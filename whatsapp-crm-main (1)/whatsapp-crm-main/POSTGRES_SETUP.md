# Guia rápido para testar com PostgreSQL

## OPÇÃO 1 - Docker (se tiver Docker Desktop)
1. Instalar Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Rodar: docker-compose up -d db

## OPÇÃO 2 - PostgreSQL local (recomendado agora)
1. Baixar PostgreSQL: https://www.postgresql.org/download/windows/
2. Instalar com configurações:
   - Porta: 5432
   - Usuário: postgres  
   - Senha: password
   - Database: crm

## OPÇÃO 3 - Usar serviço gratuito online (mais rápido para teste)
1. Criar conta gratuita no Neon: https://neon.tech
2. Criar database
3. Copiar connection string
4. Atualizar DATABASE_URL no .env

## PARA CONTINUAR AGORA (enquanto decide):
Podemos usar o SQLite mesmo e migrar depois. 
Só trocar no .env:
DATABASE_URL="file:./dev.db"

Quer que eu:
A) Volte para SQLite e continuemos?
B) Te ajude com PostgreSQL local?  
C) Use Neon.tech (online, gratuito)?