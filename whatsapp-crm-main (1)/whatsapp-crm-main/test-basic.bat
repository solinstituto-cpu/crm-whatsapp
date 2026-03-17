@echo off
REM WhatsApp CRM - Script de execução de testes básicos para Windows

echo 🧪 Executando testes básicos do WhatsApp CRM...

set API_URL=http://localhost:4000/api
set WEB_URL=http://localhost:3000

echo Verificando se os serviços estão online...

echo.
echo Testing: GET %API_URL%/wa/health
curl -s -w "Status: %%{http_code}\n" %API_URL%/wa/health

echo.
echo Testing: GET %WEB_URL%
curl -s -o nul -w "Web App Status: %%{http_code}\n" %WEB_URL%

echo.
echo Testing: GET %API_URL%/wa/webhook (webhook verification)
curl -s -w "Status: %%{http_code}\n" "%API_URL%/wa/webhook?hub.mode=subscribe&hub.verify_token=uma-string-secreta&hub.challenge=test123"

echo.
echo Testing: POST %API_URL%/auth/login (should return 401)
curl -s -w "Status: %%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"email\":\"invalid\",\"password\":\"invalid\"}" %API_URL%/auth/login

echo.
echo Testing: GET %API_URL%/contacts (protected endpoint - should return 401)
curl -s -w "Status: %%{http_code}\n" %API_URL%/contacts

echo.
echo ✅ Testes básicos concluídos!
echo.
echo Para testes completos:
echo 1. Configure suas credenciais WhatsApp no .env
echo 2. Execute: npm run db:seed (para criar usuários de teste)
echo 3. Use a coleção Postman para testes completos com autenticação
echo 4. Acesse http://localhost:3000 para testar o frontend

pause