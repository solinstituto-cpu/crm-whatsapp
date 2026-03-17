# Setup banco de producao - migrations + seed
# Execute no PowerShell: cd d:\crmDENI\apps\api; .\setup-prod-db.ps1

$env:DATABASE_URL = "postgresql://postgres.zrtnrcwfprwfedtuvscl:Kurosaki7447%40%24%23@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

Write-Host "1. Criando tabelas (migrations)..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tentando db push como alternativa..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host "`n2. Criando usuarios (seed)..." -ForegroundColor Cyan
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`nConcluido! Use admin@crm.com / admin123 para login." -ForegroundColor Green
