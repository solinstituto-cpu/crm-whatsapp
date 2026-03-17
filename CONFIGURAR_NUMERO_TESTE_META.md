# 📱 Configurar Número de Teste da API Meta (WhatsApp Cloud API)

Guia para configurar um novo número de teste que você vai criar na Meta amanhã.

---

## 1️⃣ Na Meta (developers.facebook.com)

### Criar ou usar um App existente
1. Acesse **https://developers.facebook.com/apps**
2. Crie um novo app ou use um existente
3. Adicione o produto **WhatsApp** ao app (se ainda não tiver)

### Obter as credenciais
1. Vá em **WhatsApp** → **API Setup** (ou Configuração)
2. Anote:
   - **Phone Number ID** – ID do número de teste
   - **Access Token** – token temporário (válido 24h em desenvolvimento)
   - **Business Account ID** (WABA ID) – ID da conta Business (ex: 119555137908268)

### Adicionar número de teste
1. Em **API Setup**, em **To** (Para), clique em **Manage phone number list**
2. Adicione seu número pessoal como número de teste
3. Você receberá um código no WhatsApp para confirmar

---

## 2️⃣ Configurar Webhook no Meta

O webhook é configurado **uma vez por app** e serve para todos os números.

1. Em **WhatsApp** → **Configuration** → **Webhook**
2. Clique em **Edit** ou **Configure**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Callback URL** | `https://crm-drm.onrender.com/api/wa/webhook` |
| **Verify Token** | `sol_verify_token` (ou o que estiver no seu Render) |

4. Marque os campos:
   - ✅ messages
   - ✅ message_deliveries
   - ✅ message_reads
   - ✅ message_reactions
   - ✅ message_echoes (opcional)

5. Clique em **Verify and Save**

---

## 3️⃣ No CRM – duas opções

### Opção A: Via Configurações (recomendado)

1. Acesse **Configurações** → aba **WhatsApp**
2. Clique em **+ Nova conta**
3. Preencha:

| Campo | Onde pegar |
|-------|------------|
| **Nome** | Ex: "Número de Teste" |
| **Número** | Número formatado (ex: 5511999999999) |
| **Phone Number ID** | Meta → API Setup |
| **Business ID** | Meta → API Setup (WABA ID) |
| **Access Token** | Meta → API Setup (token temporário) |
| **Verify Token** | `sol_verify_token` (mesmo do webhook) |
| **Padrão** | Marque se for a conta principal |

4. Salve e clique em **Testar** para validar a conexão

### Opção B: Via variáveis de ambiente (Render)

Se for a **primeira conta** e não houver nenhuma cadastrada, a API cria automaticamente a partir do `.env`:

No **Render** → seu Web Service → **Environment**:

```
WHATSAPP_BUSINESS_PHONE_ID=<seu Phone Number ID>
WHATSAPP_ACCESS_TOKEN=<seu Access Token>
WHATSAPP_BUSINESS_ACCOUNT_ID=<seu WABA ID>
WHATSAPP_VERIFY_TOKEN=sol_verify_token
WA_VERIFY_TOKEN=sol_verify_token
```

Depois faça um **redeploy** da API.

---

## 4️⃣ Variáveis usadas no projeto

| Variável | Uso |
|----------|-----|
| `WHATSAPP_BUSINESS_PHONE_ID` | Phone Number ID (API) |
| `WHATSAPP_PHONE_NUMBER_ID` | Mesmo valor (alguns fluxos) |
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID |
| `WHATSAPP_VERIFY_TOKEN` / `WA_VERIFY_TOKEN` | Token do webhook |

---

## 5️⃣ Testar

1. **Teste de conexão:** Configurações → WhatsApp → botão **Testar** na conta
2. **Enviar mensagem:** Inbox → selecione a conta → envie para um número de teste
3. **Receber mensagem:** Envie do seu WhatsApp para o número do app e confira no Inbox

---

## ⚠️ Lembretes

- **Token temporário:** Em modo desenvolvimento, o token expira em ~24h. Gere um novo em API Setup quando precisar.
- **Números de teste:** Só pode enviar para números adicionados como teste no Meta.
- **Produção:** Para uso real, é preciso enviar o app para revisão e usar token permanente.

---

## 📍 URLs importantes

- **API (Render):** https://crm-drm.onrender.com
- **Webhook:** https://crm-drm.onrender.com/api/wa/webhook
- **Meta Apps:** https://developers.facebook.com/apps
