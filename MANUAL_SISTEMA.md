# 📱 Manual do Sistema - WhatsApp CRM

## Índice

1. [Visão Geral](#visão-geral)
2. [Caixa de Entrada (Inbox)](#caixa-de-entrada-inbox)
3. [Contatos](#contatos)
4. [Pipeline de Vendas](#pipeline-de-vendas)
5. [Automações (Fluxos)](#automações-fluxos)
6. [Campanhas](#campanhas)
7. [Templates](#templates)
8. [Respostas Rápidas](#respostas-rápidas)
9. [Relatórios](#relatórios)
10. [Configurações](#configurações)
11. [Usuários e Permissões](#usuários-e-permissões)

---

## Visão Geral

O **WhatsApp CRM** é uma plataforma completa para gerenciamento de conversas e relacionamento com clientes via WhatsApp Business API. O sistema permite:

- 💬 Gerenciar conversas em tempo real
- 👥 Organizar contatos e clientes
- 🔄 Automatizar respostas e fluxos
- 📊 Acompanhar métricas e relatórios
- 👨‍💼 Trabalho em equipe com múltiplos atendentes

---

## Caixa de Entrada (Inbox)

### Acesso
Menu lateral: **Caixa de Entrada** ou atalho direto `/inbox`

### Funcionalidades

#### 📋 Lista de Conversas
- **Ativas**: Conversas em andamento
- **Arquivadas**: Conversas finalizadas/arquivadas
- **Busca**: Campo para buscar por nome ou telefone
- **Indicador de não lidas**: Bolinha azul com número de mensagens não lidas

#### 💬 Área de Mensagens

**Enviar Mensagens:**
- Digite no campo de texto e pressione **Enter** ou clique no botão de enviar
- Use **Shift + Enter** para quebra de linha (nova linha sem enviar)

**Anexar Arquivos (botão 📎):**
| Tipo | Formatos Aceitos | Tamanho Máximo |
|------|------------------|----------------|
| 🖼️ Foto | JPG, PNG, WebP | 5MB |
| 🎥 Vídeo | MP4, 3GP | 16MB |
| 📄 Documento | PDF, DOC, DOCX, XLS, XLSX, TXT | 100MB |
| 🎵 Áudio | AAC, MP4, MPEG, AMR, OGG | 16MB |
| 👤 Contato | Nome + Telefone | - |

**Responder Mensagem (Quote/Reply):**
1. Passe o mouse sobre a mensagem
2. Clique na seta ↩️ que aparece
3. A mensagem aparece citada acima do campo de texto
4. Digite sua resposta
5. O destinatário verá a mensagem com a citação

**Emojis:**
- Clique no botão 😊 para abrir o seletor de emojis
- Clique no emoji desejado para inserir

**Respostas Rápidas (botão ⚡):**
- Clique no ícone de raio
- Selecione a categoria desejada
- Clique na resposta para inserir
- O texto é inserido no campo de mensagem

**Templates (botão 📄):**
- Clique no ícone de documento
- Selecione um template aprovado
- Preencha as variáveis ({{1}}, {{2}}, etc.) se houver
- Anexe mídia se o template exigir (imagem, vídeo ou documento)
- Clique em "Enviar Template"

#### 👤 Menu do Contato (três pontinhos ⋮)
- **Ver perfil**: Informações do contato
- **Transferir**: Transferir conversa para outro atendente
- **Arquivar/Desarquivar**: Mover conversa entre ativas e arquivadas
- **Excluir**: Remove a conversa permanentemente

#### 🔄 Atualização em Tempo Real
- As conversas são atualizadas automaticamente a cada 5 segundos
- Novas mensagens aparecem sem precisar recarregar a página
- Som de notificação quando chega nova mensagem

#### ⬇️ Botão de Scroll
- Quando você rolar para cima, aparece um botão para voltar ao final
- Clique para ir direto às mensagens mais recentes

#### 📱 Tipos de Mensagens Exibidas
| Tipo | Exibição |
|------|----------|
| Texto | Texto normal |
| Imagem | 📷 + Preview da imagem (se disponível) |
| Vídeo | 🎥 + Player de vídeo (se disponível) |
| Áudio | 🎵 + Player de áudio (se disponível) |
| Documento | 📄 + Nome do arquivo + Link para baixar |
| Figurinha | 🎨 Figurinha |
| Template | 📋 Template + Texto |
| Contato | 👤 Nome do contato |
| Localização | 📍 Localização |
| Botão clicado | Texto do botão selecionado |

---

## Contatos

### Acesso
Menu lateral: **Contatos** ou `/contacts`

### Funcionalidades

#### 📋 Lista de Contatos
- Visualização de todos os contatos cadastrados
- Busca por nome, telefone ou email
- Ordenação por nome ou data de criação

#### ➕ Adicionar Contato
Campos disponíveis:
- **Nome** (obrigatório)
- **Telefone** (formato: +5511999999999)
- **Email**
- **Empresa**
- **Cargo**
- **Endereço**
- **Tags** (para categorização)
- **Campos Personalizados**

#### ✏️ Editar Contato
- Clique no contato para abrir detalhes
- Edite as informações desejadas
- Salve as alterações

#### 🏷️ Tags
- Adicione tags para categorizar contatos
- Use para filtrar e segmentar
- Exemplos: "Cliente VIP", "Lead Quente", "Suporte"

#### 📤 Iniciar Conversa
- A partir do contato, inicie uma nova conversa
- Envia automaticamente para a Caixa de Entrada

---

## Pipeline de Vendas

### Acesso
Menu lateral: **Pipeline** ou `/pipeline`

### Funcionalidades

#### 🎯 Kanban de Oportunidades
- Visualização em colunas (estágios do funil)
- Arraste e solte cards entre colunas
- Veja o valor total por estágio

#### 📊 Estágios Padrão
1. **Lead** - Novo contato/interesse
2. **Qualificação** - Em análise
3. **Proposta** - Proposta enviada
4. **Negociação** - Em negociação
5. **Fechado Ganho** - Venda concluída
6. **Fechado Perdido** - Oportunidade perdida

#### ➕ Criar Oportunidade (Deal)
- **Título**: Nome da oportunidade
- **Valor**: Valor estimado
- **Contato**: Vincular a um contato
- **Estágio**: Etapa atual
- **Previsão de fechamento**: Data estimada
- **Descrição**: Detalhes adicionais

#### 🔗 Integração com Conversas
- Acesse a conversa diretamente do deal
- Histórico completo do relacionamento

---

## Automações (Fluxos)

### Acesso
Menu lateral: **Automações** ou `/automations`

### Tipos de Gatilhos

#### 🔑 Por Palavra-Chave
- Dispara quando o cliente envia uma palavra específica
- Exemplo: "Olá", "Preço", "Suporte"
- Pode ter múltiplas palavras-chave

#### 🆕 Primeira Mensagem
- Dispara apenas na primeira mensagem do contato
- Ideal para boas-vindas

#### ⏰ Fora do Horário
- Dispara quando mensagem chega fora do expediente
- Configure os horários de atendimento

### Tipos de Ações

#### 💬 Enviar Mensagem de Texto
- Mensagem simples de texto
- Suporta variáveis: `{{nome}}`, `{{telefone}}`

#### 📋 Enviar Template
- Envia template aprovado do WhatsApp
- Pode incluir variáveis e mídia

#### 🖼️ Enviar Imagem
- Envia imagem com ou sem legenda
- Use URL da imagem

#### 🔘 Mensagem com Botões
- Até 3 botões de resposta rápida
- Cliente clica e resposta é registrada

#### ⏳ Aguardar Resposta
- Pausa o fluxo aguardando resposta
- Define timeout (tempo máximo de espera)

#### 🏷️ Adicionar Tag
- Adiciona tag automaticamente ao contato

#### 👤 Atribuir Atendente
- Transfere para atendente específico

### Criando um Fluxo

1. Clique em **"Novo Fluxo"**
2. Defina um **nome** para o fluxo
3. Escolha o **gatilho** (o que inicia o fluxo)
4. Adicione **ações** em sequência
5. Configure **condições** se necessário
6. **Ative** o fluxo

### Exemplo de Fluxo de Boas-Vindas

```
Gatilho: Primeira Mensagem
  ↓
Ação 1: Enviar Mensagem
  "Olá {{nome}}! Bem-vindo à nossa empresa! 🎉"
  ↓
Ação 2: Aguardar (2 segundos)
  ↓
Ação 3: Enviar Mensagem com Botões
  "Como posso ajudar você hoje?"
  [Fazer Pedido] [Suporte] [Falar com Vendas]
  ↓
Ação 4: Adicionar Tag "Novo Lead"
```

---

## Campanhas

### Acesso
Menu lateral: **Campanhas** ou `/campaigns`

### Funcionalidades

#### 📢 Criar Campanha
1. **Nome da campanha**
2. **Template**: Escolha o template aprovado
3. **Público-alvo**: 
   - Todos os contatos
   - Por tags específicas
   - Lista personalizada
4. **Agendamento**: 
   - Enviar agora
   - Agendar para data/hora específica
5. **Horários permitidos**: Define janela de envio

#### 📊 Métricas da Campanha
- Total de destinatários
- Mensagens enviadas
- Mensagens entregues
- Mensagens lidas
- Respostas recebidas
- Taxa de abertura

#### ⚙️ Configurações Avançadas
- **Intervalo entre envios**: Evita bloqueio do WhatsApp
- **Limite diário**: Máximo de mensagens por dia
- **Filtros**: Excluir contatos que já receberam recentemente

---

## Templates

### Acesso
Menu lateral: **Templates** ou `/templates`

### Sobre Templates

Templates são mensagens pré-aprovadas pelo WhatsApp/Meta. São **obrigatórios** para:
- Iniciar conversas (fora da janela de 24h)
- Campanhas em massa
- Mensagens promocionais

### Status dos Templates
| Status | Descrição |
|--------|-----------|
| 🟢 APPROVED | Aprovado e pronto para uso |
| 🟡 PENDING | Aguardando aprovação |
| 🔴 REJECTED | Rejeitado pela Meta |

### Categorias
- **MARKETING**: Promoções, ofertas, novidades
- **UTILITY**: Atualizações de pedido, lembretes
- **AUTHENTICATION**: Códigos de verificação

### Componentes do Template

#### Header (Cabeçalho)
- **Texto**: Título simples
- **Imagem**: Requer upload na hora do envio
- **Vídeo**: Requer upload na hora do envio
- **Documento**: Requer upload na hora do envio

#### Body (Corpo)
- Texto principal da mensagem
- Suporta variáveis: `{{1}}`, `{{2}}`, etc.
- Máximo de 1024 caracteres

#### Footer (Rodapé)
- Texto pequeno opcional
- Máximo de 60 caracteres

#### Botões
- **URL**: Abre link externo
- **Telefone**: Liga para número
- **Resposta Rápida**: Responde com texto

### Usando Templates com Variáveis

Ao enviar um template com variáveis:
1. O sistema detecta quantas variáveis existem
2. Mostra campos para preencher cada uma
3. Substitui `{{1}}` pelo primeiro valor, `{{2}}` pelo segundo, etc.

Exemplo:
```
Template: "Olá {{1}}, seu pedido {{2}} foi enviado!"
Variável 1: "João"
Variável 2: "#12345"
Resultado: "Olá João, seu pedido #12345 foi enviado!"
```

---

## Respostas Rápidas

### Acesso
Menu lateral: **Respostas Rápidas** ou `/quick-replies`

### O que são
Textos pré-definidos para agilizar o atendimento. Diferente de templates, são usados apenas **dentro da janela de 24h**.

### Criando Respostas Rápidas

1. Clique em **"Nova Resposta"**
2. **Título**: Nome para identificar (ex: "Saudação")
3. **Categoria**: Agrupe respostas similares
4. **Conteúdo**: Texto da resposta
5. **Salvar**

### Categorias Sugeridas
- 👋 Saudações
- 💰 Preços
- 📦 Pedidos
- 🛠️ Suporte
- 👋 Despedidas
- ❓ FAQ

### Usando na Conversa
1. Na caixa de entrada, clique no ícone ⚡
2. Navegue pelas categorias
3. Clique na resposta desejada
4. O texto é inserido no campo
5. Edite se necessário e envie

---

## Relatórios

### Acesso
Menu lateral: **Relatórios** ou `/reports`

### Métricas Disponíveis

#### 📊 Visão Geral
- Total de conversas
- Mensagens enviadas/recebidas
- Tempo médio de resposta
- Taxa de resolução

#### 👥 Por Atendente
- Conversas atendidas
- Tempo médio de atendimento
- Satisfação do cliente

#### 📈 Por Período
- Gráficos diários/semanais/mensais
- Horários de pico
- Dias mais movimentados

#### 🏷️ Por Tags
- Distribuição de tags
- Conversões por categoria

---

## Configurações

### Acesso
Menu lateral: **Configurações** ou `/settings`

### Configurações Gerais

#### 🏢 Dados da Empresa
- Nome da empresa
- Logo
- Horário de atendimento

#### 📱 WhatsApp Business
- Phone Number ID
- Business Account ID
- Access Token
- Webhook Verify Token

#### ⏰ Horário de Atendimento
- Dias da semana
- Hora de início e fim
- Fuso horário

#### 🔔 Notificações
- Sons de nova mensagem
- Notificações do navegador

---

## Usuários e Permissões

### Acesso
Menu lateral: **Usuários** ou `/users`

### Tipos de Usuário

| Papel | Permissões |
|-------|------------|
| **Admin** | Acesso total ao sistema |
| **Agent** | Atendimento e conversas |
| **Viewer** | Apenas visualização |

### Gerenciando Usuários

#### ➕ Adicionar Usuário
1. Clique em **"Novo Usuário"**
2. Preencha email e nome
3. Defina a senha inicial
4. Escolha o papel/permissão
5. Salvar

#### ✏️ Editar Usuário
- Alterar nome, email
- Mudar permissões
- Resetar senha

#### ❌ Desativar Usuário
- Usuários desativados não podem fazer login
- Histórico de atendimento é mantido

### Status Online/Offline
- Indicador verde = Online (ativo nos últimos 5 min)
- Indicador cinza = Offline

---

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Enter` | Enviar mensagem |
| `Shift + Enter` | Nova linha (sem enviar) |
| `Esc` | Fechar modais/popups |

---

## Dicas e Boas Práticas

### 📱 WhatsApp Business API

1. **Janela de 24 horas**: Após o cliente enviar mensagem, você tem 24h para responder livremente. Depois, só templates.

2. **Templates**: Envie para aprovação com antecedência (pode levar até 24h).

3. **Qualidade da conta**: Evite spam. Muitos bloqueios podem suspender sua conta.

### 💬 Atendimento

1. **Responda rápido**: Clientes esperam respostas em minutos.

2. **Use respostas rápidas**: Agilize sem perder qualidade.

3. **Personalize**: Use o nome do cliente quando possível.

4. **Transfira quando necessário**: Não hesite em passar para quem pode ajudar melhor.

### 🤖 Automações

1. **Comece simples**: Primeiro automatize o básico (boas-vindas).

2. **Teste antes**: Use seu próprio número para testar fluxos.

3. **Monitore**: Verifique se as automações estão funcionando.

---

## Suporte

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| Mensagens não chegam | Verifique webhook e tokens |
| Template rejeitado | Revise conteúdo e reenvia |
| Mídia não carrega | Verifique formato e tamanho |
| Contato bloqueado | Aguarde 24h ou use template |

### Logs e Debug
- Acesse o console do navegador (F12) para ver logs
- Logs do servidor no Render Dashboard

---

## Atualizações Recentes

### Janeiro 2026
- ✅ Conversas arquivadas
- ✅ Envio de anexos (foto, vídeo, documento, áudio, contato)
- ✅ Responder/citar mensagens
- ✅ Shift+Enter para nova linha
- ✅ Atualização automática de conversas
- ✅ Botão de scroll para baixo
- ✅ Respostas rápidas com categorias
- ✅ Templates com variáveis e mídia
- ✅ Suporte a figurinhas (stickers)
- ✅ Status online/offline de atendentes
- ✅ Transferência de conversas

---

**Desenvolvido com ❤️ para facilitar seu atendimento via WhatsApp**
