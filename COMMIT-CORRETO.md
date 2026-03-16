# Como fazer commits corretos (para Vercel funcionar)

O Vercel bloqueia o deploy quando o autor do commit não é o dono do projeto.

## Antes de CADA commit, execute no terminal:

```powershell
cd D:\crmDENI
git config user.email "deni.morais747@gmail.com"
git config user.name "denimorais777"
```

## Depois faça o commit:

```powershell
git add .
git commit -m "Sua mensagem"
git push
```

## NUNCA use o botão de commit do Cursor/VS Code
O Cursor adiciona "Made-with: Cursor" e muda o autor para "denimorais747-sketch", o que bloqueia o Vercel.

Sempre use o **PowerShell** ou **Git Bash** para commitar.
