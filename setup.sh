#!/bin/bash

echo "🚀 Configurando WhatsApp CRM..."

# Instalar dependências do projeto raiz
echo "📦 Instalando dependências do projeto raiz..."
npm install

# Instalar dependências da API
echo "📦 Instalando dependências da API..."
cd apps/api && npm install

# Voltar para raiz e instalar dependências do Web
echo "📦 Instalando dependências do Web..."
cd ../web && npm install

# Voltar para raiz
cd ../..

echo "✅ Dependências instaladas com sucesso!"

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Copiando .env.example para .env..."
    cp .env.example .env
    echo "📝 Por favor, configure suas variáveis de ambiente no arquivo .env"
fi

echo "🎉 Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Configure o arquivo .env com suas credenciais"
echo "2. Execute: npm run docker:up"
echo "3. Execute: npm run db:push && npm run db:seed"
echo "4. Execute: npm run dev"