# 🔍 **DEBUG PLAN - MENSAGENS NÃO CHEGANDO**

## 📊 **STATUS CONFIRMADO:**
- ✅ Número na lista Meta Business
- ✅ Meta envia direto pelo dashboard  
- ✅ Nossa API confirma "sucesso"
- ❌ Mensagens não chegam via nosso CRM

## 🎯 **TESTES PARA AMANHÃ:**

### **TESTE 1: COMPARAR REQUESTS**
```bash
# Meta Dashboard Request (capturar):
POST https://graph.facebook.com/v22.0/134483439737705/messages
Headers: [capturar todos]
Body: [capturar exato]

# Nosso Sistema Request (verificar):
POST https://graph.facebook.com/v18.0/134483439737705/messages  
Headers: [comparar]
Body: [comparar estrutura]
```

### **TESTE 2: WEBHOOK TEMPORÁRIO**
```bash
# webhook.site:
1. Criar: https://webhook.site/novo-id
2. Meta Config: URL + verify token
3. Testar se resolve delivery

# OU ngrok:
1. ngrok http 4000
2. https://xxx.ngrok.io/api/wa/webhook
3. Configurar no Meta
```

### **TESTE 3: cURL DIRETO**
```bash
curl -X POST \
"https://graph.facebook.com/v18.0/134483439737705/messages" \
-H "Authorization: Bearer EAALhsiZB9HoQBPlW62RZCGFZBVkt3BBZCciMPrl9C2yn0jI8wr2a90n5tQ2BbxK2qZAO7Jsm9mLuSli8UNbDZB1JvqESfAIE6UG497by4qAW2mtzJfuKzZA3auEZAJSKXE73V0C7UCPJIvfpw1L9gI7ZCZBelWz1AZARnuWEDzmkw10w9lwGr1GdAKDt9xstXy6hdIG9DGQg2ewlzflKFwbzDtzXretcTZBcOQ9wncfkDKDz7hLwdcMZD" \
-H "Content-Type: application/json" \
-d '{"messaging_product":"whatsapp","to":"5511992964792","type":"text","text":{"body":"Teste cURL direto"}}'
```

## 🔧 **POSSÍVEIS CAUSAS:**

### **CAUSA 1: WEBHOOK OBRIGATÓRIO**
- Meta pode exigir webhook ativo
- Sem webhook = não entrega
- **Fix:** Configurar webhook temporário

### **CAUSA 2: HEADERS INCORRETOS**
- User-Agent missing
- API Version diferente (v18 vs v22)
- **Fix:** Copiar headers exatos do Meta

### **CAUSA 3: PAYLOAD FORMAT**
- Estrutura JSON incorreta
- Campos obrigatórios missing
- **Fix:** Comparar payloads

### **CAUSA 4: PERMISSIONS/RESTRICTIONS**
- App permissions insuficientes
- Business Account restrictions
- **Fix:** Revisar Meta Business config

## ⏰ **CRONOGRAMA AMANHÃ:**
- 09:00-09:30: Comparar requests
- 09:30-10:15: Webhook temporário  
- 10:15-10:45: Revisão código
- 10:45-11:05: Verificar permissions
- 11:05-11:20: Teste cURL
- 11:20-11:30: Aplicar correção

## 🎯 **OBJETIVO:**
**Mensagens chegando via CRM = SUCESSO!**

---
**PLANO PRONTO PARA EXECUÇÃO AMANHÃ** ✅