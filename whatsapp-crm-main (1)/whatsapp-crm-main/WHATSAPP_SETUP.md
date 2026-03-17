# 🔧 Configuração WhatsApp Cloud API - Sol Instituto

## 📱 **Informações do Seu App Meta**
- **App ID:** 811105374772868
- **Nome:** API_WHATS_SOL
- **Status:** Desenvolvimento ✅
- **Tipo:** Empresa

## 🚀 **Passo-a-Passo de Configuração**

### 1️⃣ **Obter Access Token**
1. No painel do Meta Business (que você já tem aberto)
2. Clique em **WhatsApp** → **Configurar**
3. Na seção **Access Token**, copie o token temporário
4. Cole no arquivo `.env.local` na variável `WHATSAPP_ACCESS_TOKEN`

### 2️⃣ **Obter Phone Number ID**
1. Ainda no painel WhatsApp
2. Procure por **Phone Number ID** (geralmente na seção de números de teste)
3. Copie o ID do número
4. Cole no arquivo `.env.local` na variável `WHATSAPP_PHONE_NUMBER_ID`

### 3️⃣ **Configurar Webhook**
1. Na seção **Webhooks** do painel
2. **URL do Webhook:** `https://seudominio.com/api/whatsapp/webhook`
3. **Verify Token:** `sol_instituto_verify_2025` (use este)
4. **Eventos para Assinar:**
   - ✅ messages
   - ✅ message_deliveries
   - ✅ message_reads
   - ✅ message_reactions

### 4️⃣ **Configurar Número de Telefone**
1. Adicione um número de telefone de teste
2. Use seu próprio número para testar
3. Certifique-se que está verificado

## 🔑 **Variáveis de Ambiente - Exemplo**

```bash
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_VERIFY_TOKEN="sol_instituto_verify_2025"
WHATSAPP_WEBHOOK_URL="https://seudominio.com/api/whatsapp/webhook"

# Meta App Configuration  
META_APP_ID="811105374772868"
META_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 📞 **Números de Teste**
Durante o desenvolvimento, você pode:
- Usar números de telefone de teste fornecidos pelo Meta
- Adicionar até 5 números para teste
- Enviar mensagens apenas para números autorizados

## 🌐 **Para Produção (Depois)**
1. **Verificação do Aplicativo:**
   - Enviar para revisão do Meta
   - Aguardar aprovação (2-7 dias)
   
2. **Upgrade do Token:**
   - Gerar token permanente
   - Configurar webhook público

3. **Número Oficial:**
   - Usar número comercial real
   - Configurar Business Profile

## ⚡ **Como Testar Agora**

1. **Configure as variáveis** no `.env.local`
2. **Restart o servidor:** `npm run dev`
3. **Teste no Inbox:** Envie uma mensagem de teste
4. **Verifique logs:** Console do navegador e terminal

## 🆘 **Onde Encontrar as Informações**

### Access Token:
- **Local:** Meta Business → WhatsApp → API Setup → Temporary Access Token

### Phone Number ID:
- **Local:** Meta Business → WhatsApp → API Setup → Phone Number ID

### App Secret:
- **Local:** Meta Business → App Settings → Basic → App Secret

---

## 🎯 **Próximos Passos**

1. Pegue as informações do painel Meta
2. Atualize o arquivo `.env.local`
3. Me avise quando tiver as informações
4. Vamos testar juntos! 🚀

**Precisa de ajuda para encontrar alguma informação específica?**