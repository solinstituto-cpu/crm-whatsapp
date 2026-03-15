# Script de deploy direto para Vercel
# Execute no PowerShell: .\deploy-vercel.ps1
#
# OPCAO 1 - Com token (sem abrir navegador):
#   1. Acesse https://vercel.com/account/tokens
#   2. Crie um token e copie
#   3. Execute: $env:VERCEL_TOKEN="seu_token"; .\deploy-vercel.ps1
#
# OPCAO 2 - Com login (abre navegador):
#   Execute: .\deploy-vercel.ps1

Write-Host "=== Deploy CRM-DRM para Vercel ===" -ForegroundColor Cyan

# Verificar se está logado ou tem token
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nVoce precisa fazer login na Vercel primeiro." -ForegroundColor Yellow
    Write-Host "Um navegador vai abrir - faca login com sua conta." -ForegroundColor Yellow
    Write-Host ""
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login falhou. Tente novamente." -ForegroundColor Red
        exit 1
    }
}

# Vincular ao projeto existente (se ainda nao vinculado)
if (-not (Test-Path ".vercel")) {
    Write-Host "`nVinculando ao projeto crm-drm..." -ForegroundColor Yellow
    vercel link --yes --project crm-drm
}

Write-Host "`nFazendo deploy..." -ForegroundColor Green
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeploy concluido com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`nDeploy falhou. Verifique os erros acima." -ForegroundColor Red
    exit 1
}
