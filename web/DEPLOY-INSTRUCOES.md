# Deploy direto para Vercel

O deploy via GitHub está bloqueado no plano Hobby. Use o deploy direto:

## Passo 1: Criar token na Vercel (recomendado)

1. Acesse https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Nome: `crm-drm-deploy`
4. Copie o token gerado

## Passo 2: Executar o deploy

Abra o **PowerShell** na pasta `D:\crmDENI\web` e execute:

```powershell
# Com token (cole o token que você copiou):
$env:VERCEL_TOKEN="seu_token_aqui"
.\deploy-vercel.ps1
```

**OU** sem token (vai abrir o navegador para login):

```powershell
.\deploy-vercel.ps1
```

## Se pedir para vincular ao projeto

Quando perguntar "Link to existing project?", digite **Y** e depois **crm-drm**.
