@echo off
echo 🚀 Configurando WhatsApp CRM...

REM Instalar dependências do projeto raiz
echo 📦 Instalando dependências do projeto raiz...
call npm install

REM Instalar dependências da API
echo 📦 Instalando dependências da API...
cd apps\api
call npm install

REM Voltar para raiz e instalar dependências do Web
echo 📦 Instalando dependências do Web...
cd ..\web
call npm install

REM Voltar para raiz
cd ..\..

echo ✅ Dependências instaladas com sucesso!

REM Verificar se .env existe
if not exist .env (
    echo ⚠️ Copiando .env.example para .env...
    copy .env.example .env
    echo 📝 Por favor, configure suas variáveis de ambiente no arquivo .env
)

echo 🎉 Setup concluído!
echo.
echo Próximos passos:
echo 1. Configure o arquivo .env com suas credenciais
echo 2. Execute: npm run docker:up
echo 3. Execute: npm run db:push ^&^& npm run db:seed
echo 4. Execute: npm run dev

pause