# Script para migrar do SQLite para PostgreSQL
Write-Host "🐘 Iniciando migração para PostgreSQL..." -ForegroundColor Green

# Passo 1: Subir PostgreSQL via Docker
Write-Host "📦 Subindo PostgreSQL via Docker..."
docker-compose up -d db

# Aguardar PostgreSQL inicializar
Write-Host "⏳ Aguardando PostgreSQL inicializar..."
Start-Sleep -Seconds 10

# Passo 2: Executar migrations no PostgreSQL
Write-Host "🔄 Executando migrations no PostgreSQL..."
Set-Location "apps/api"
npx prisma migrate deploy --schema="./prisma/schema.prisma"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar migrations" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

# Passo 3: Gerar client do Prisma
Write-Host "🔧 Gerando Prisma client..."
npx prisma generate --schema="./prisma/schema.prisma"

# Passo 4: Fazer seed (dados iniciais)
Write-Host "🌱 Criando dados iniciais..."
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Aviso: Seed pode ter falhado, mas continuando..." -ForegroundColor Yellow
}

Set-Location "../.."

Write-Host "✅ Migração concluída!" -ForegroundColor Green
Write-Host "🚀 Para testar, rode: npm run dev:api" -ForegroundColor Cyan
Write-Host "🌐 API estará em: http://localhost:4000" -ForegroundColor Cyan