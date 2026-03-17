# 🪝 Configuração de Webhook - Meta WhatsApp

## 📋 Após Deploy no Render

Quando sua API estiver rodando no Render, você precisa configurar o webhook no Meta.

## 🔗 URLs de Produção

Sua API estará em:
```
https://crm-api-[seu-hash].onrender.com
```

## ⚙️ 1. Configurar Webhook no Meta

### No Meta App Dashboard:
1. Acesse: https://developers.facebook.com/apps
2. Selecione seu app WhatsApp
3. WhatsApp → Configuration

### Configurar Webhook:
```
Callback URL: https://crm-api-[seu-hash].onrender.com/api/wa/webhook
Verify Token: <seu WHATSAPP_VERIFY_TOKEN atual>
```

### Webhook Fields (marcar):
- [x] messages
- [x] message_deliveries  
- [x] message_reads
- [x] message_reactions
- [x] message_echoes

## ✅ 2. Testar Webhook

### Verificar se está funcionando:
```bash
# 1. Health check da API
GET https://crm-api-[seu-hash].onrender.com/api/wa/health

# 2. Verificar webhook
GET https://crm-api-[seu-hash].onrender.com/api/wa/webhook?hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=test&hub.mode=subscribe
```

### Deve retornar:
- Health: `{"status":"ok","timestamp":"..."}`
- Webhook: `test` (o valor do challenge)

## 🔄 3. Fluxo Completo

### Quando alguém mandar mensagem para seu WhatsApp:
1. Meta recebe a mensagem
2. Meta envia POST para `https://crm-api-[seu-hash].onrender.com/api/wa/webhook`
3. Sua API processa e salva no PostgreSQL
4. Frontend mostra a conversa atualizada

### Quando você enviar pelo sistema:
1. Frontend chama API: `POST /api/wa/send`
2. API chama Meta Graph API
3. Meta entrega no WhatsApp do cliente
4. Meta confirma entrega via webhook
5. Conversa é atualizada

## 🐛 Troubleshooting

### Webhook não verifica:
- Verificar se WHATSAPP_VERIFY_TOKEN está correto
- Verificar se API está rodando
- Verificar logs no Render

### Mensagens não chegam:
- Verificar se webhook está configurado
- Verificar tokens de acesso
- Verificar logs da aplicação

### Produção vs Desenvolvimento:
```bash
# Desenvolvimento
Webhook: http://localhost:4000/api/wa/webhook (não funciona - só local)

# Produção  
Webhook: https://crm-api-[seu-hash].onrender.com/api/wa/webhook (funciona)
```

**IMPORTANTE**: O Meta só consegue enviar webhooks para URLs públicas (HTTPS). Por isso precisamos do Render para produção.

## 📊 Monitoramento

### Verificar se webhooks estão chegando:
1. Render → Logs da aplicação
2. Procurar por: `[WEBHOOK]` nos logs
3. Verificar se mensagens estão sendo salvas no PostgreSQL

### Logs importantes:
```
[WEBHOOK] Received webhook: {...}
[WEBHOOK] Message saved: {...}  
[SEND] Message sent successfully: {...}
```