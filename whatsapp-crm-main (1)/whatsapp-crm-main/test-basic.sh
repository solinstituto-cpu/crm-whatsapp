#!/bin/bash

# WhatsApp CRM - Script de execução de testes básicos

echo "🧪 Executando testes básicos do WhatsApp CRM..."

API_URL="http://localhost:4000/api"
WEB_URL="http://localhost:3000"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local data=$4
    
    echo -e "${BLUE}Testing: $method $url${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS - Status: $status_code${NC}"
    else
        echo -e "${RED}❌ FAIL - Expected: $expected_status, Got: $status_code${NC}"
        echo -e "${RED}Response: $body${NC}"
    fi
    
    echo ""
}

# Verificar se os serviços estão rodando
echo -e "${YELLOW}Verificando se os serviços estão online...${NC}"

# Teste API Health
test_endpoint "GET" "$API_URL/wa/health" "200"

# Teste Frontend
echo -e "${BLUE}Testing: GET $WEB_URL${NC}"
web_status=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")
if [ "$web_status" = "200" ] || [ "$web_status" = "307" ]; then
    echo -e "${GREEN}✅ PASS - Web App responding${NC}"
else
    echo -e "${RED}❌ FAIL - Web App not responding (Status: $web_status)${NC}"
fi
echo ""

# Teste Webhook Verification
test_endpoint "GET" "$API_URL/wa/webhook?hub.mode=subscribe&hub.verify_token=uma-string-secreta&hub.challenge=test123" "200"

# Teste Login (deve falhar sem credenciais válidas, mas endpoint deve responder)
echo -e "${YELLOW}Testando endpoint de login (esperado 401)...${NC}"
test_endpoint "POST" "$API_URL/auth/login" "401" '{"email":"invalid","password":"invalid"}'

# Teste listagem de contatos sem auth (deve falhar com 401)
echo -e "${YELLOW}Testando endpoint protegido sem autenticação (esperado 401)...${NC}"
test_endpoint "GET" "$API_URL/contacts" "401"

echo -e "${GREEN}✅ Testes básicos concluídos!${NC}"
echo ""
echo -e "${BLUE}Para testes completos:${NC}"
echo "1. Configure suas credenciais WhatsApp no .env"
echo "2. Execute: npm run db:seed (para criar usuários de teste)"
echo "3. Use a coleção Postman para testes completos com autenticação"
echo "4. Acesse http://localhost:3000 para testar o frontend"