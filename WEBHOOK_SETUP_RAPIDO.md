# 🎯 **GUIA RÁPIDO - WEBHOOK TEMPORÁRIO**

## **PASSO 1 - WEBHOOK.SITE (ACABEI DE ABRIR)**

1. **Copie a URL** que apareceu (algo como: `https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

2. **Anote essa URL** - você vai usar ela no Meta

---

## **PASSO 2 - CONFIGURAR NO META BUSINESS**

1. **Acesse:** https://developers.facebook.com
2. **Seu App:** API_WHATS_SOL  
3. **WhatsApp** → **Configuration**
4. **Webhook:**
   - **Callback URL:** `https://webhook.site/sua-url-copiada`
   - **Verify Token:** `sol_webhook_token`

5. **Clique "Verify and Save"**

---

## **PASSO 3 - ADICIONAR SEU NÚMERO**

1. **No mesmo painel Meta:**
2. **WhatsApp** → **API Setup**
3. **Phone numbers** → **Add phone number**
4. **Digite:** `+5511992964792`
5. **Verify** (você vai receber código no WhatsApp)

---

## **PASSO 4 - TESTAR**

1. **Volte para o CRM:** http://localhost:3000/whatsapp-test
2. **Envie uma mensagem** para seu número
3. **Verifique no webhook.site** se está recebendo dados

---

## **IMPORTANTE:**

- ✅ **webhook.site** vai mostrar todas as requisições do Meta
- ✅ **Seu número** precisa estar verificado na lista de teste
- ✅ **Use essa URL temporária** apenas para testes
- ⚠️ **Para produção,** use domínio real (hostgator)

---

## **SE DER ERRO:**

1. **Verifique** se copiou a URL correta do webhook.site
2. **Confirm** o verify token: `sol_webhook_token`
3. **Adicione seu número** na lista primeiro

**Agora teste e me avise o resultado!** 🚀