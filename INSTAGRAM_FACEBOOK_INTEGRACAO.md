# Instagram + Facebook Messenger no CRM — Plano técnico e passo a passo

Branch: `feature/instagram-facebook-inbox` (não mexe em `main`/produção).

## O que foi decidido com o Rogérius (12/set/2026)

- Instagram Direct e Facebook Messenger passam a cair **na mesma caixa de
  entrada** do CRM, ao lado do WhatsApp — mesmos contatos, mesma tela de
  atendimento.
- **Sem IA/automação** nesses dois canais: as mensagens só entram na fila
  para um atendente humano responder. O motor de fluxos (IA) continua
  existindo só para WhatsApp.
- Trabalho feito numa branch separada, para não arriscar a produção
  (`sol-crm-eight.vercel.app`) enquanto isso é testado.

## O que já foi implementado nesta branch

### Banco de dados (`apps/api/prisma/schema.prisma`)
Mudanças 100% aditivas (nenhuma coluna existente foi removida ou tornada
obrigatória) — o WhatsApp continua funcionando exatamente como hoje:

- `Contact`, `Conversation` e `Message` ganharam um campo `channel`
  (`WHATSAPP` por padrão, `FACEBOOK` ou `INSTAGRAM`).
- `Contact` e `Conversation` ganharam `socialAccountId`, ligando o registro à
  Página/conta que recebeu a mensagem.
- `Contact` ganhou `externalId`: o PSID (Messenger) ou IGSID (Instagram) da
  pessoa — o "número de telefone" do Instagram/Facebook.
- Novo modelo `SocialAccount`: guarda cada Página do Facebook conectada
  (nome, Page ID, Page Access Token, e o ID da conta profissional do
  Instagram quando aplicável).

> Detalhe técnico importante: a coluna `phoneE164` do `Contact` continua
> obrigatória (é assim há muito tempo e várias telas dependem disso). Para
> contatos vindos de Instagram/Facebook, ela recebe um valor sintético tipo
> `instagram:17841400000000123` só para preencher a coluna — o identificador
> de verdade fica em `externalId`. É uma gambiarra deliberada e documentada
> no código (`social-webhook.service.ts`), para evitar mexer em todo o
> sistema agora. Se um dia quisermos "limpar" isso de vez, o caminho certo é
> tornar `phoneE164` opcional e revisar quem lê esse campo.

### Backend (`apps/api`)
- `src/social-accounts/`: CRUD de contas sociais (Página do Facebook /
  Instagram conectado), mesmo padrão do módulo `whatsapp-accounts` que já
  existe. Rotas em `/api/social-accounts` (protegidas, só ADMIN cria/edita).
- `src/social/meta-graph.service.ts`: chama a Graph API da Meta pra enviar
  mensagem de texto (Messenger e Instagram usam o mesmo endpoint quando o
  Instagram está conectado à Página).
- `src/social/social-webhook.service.ts`: processa os webhooks recebidos do
  Messenger (`object: "page"`) e do Instagram (`object: "instagram"`),
  criando/atualizando Contact → Conversation → Message, do mesmo jeito que
  já acontece pro WhatsApp — só que sem acionar o motor de automação/IA.
- `src/social/social.controller.ts`: endpoint `POST /api/social/send` usado
  pelo inbox pra responder manualmente uma conversa de Instagram/Facebook.
- `webhook.service.ts` foi ajustado para olhar o campo `object` do payload e
  decidir se é WhatsApp, Messenger ou Instagram — a Meta pode usar a MESMA
  URL de callback (`/api/wa/webhook`) pros três produtos dentro do mesmo
  app, então não precisa cadastrar uma URL nova.
- O schema de validação do webhook (`common/schemas.ts`) foi flexibilizado
  pra aceitar tanto o formato do WhatsApp (`entry[].changes`) quanto o do
  Messenger/Instagram (`entry[].messaging`).

### Frontend (`apps/web/src/app/inbox/page.tsx`)
- A lista de conversas e o cabeçalho do chat agora mostram uma etiqueta
  "IG" ou "FB" quando a conversa não é do WhatsApp.
- O envio de texto detecta o canal da conversa: WhatsApp continua indo pro
  endpoint de sempre (`/api/wa/send-public`); Instagram/Facebook vão pro
  novo `/api/social/send`.
- Envio de arquivo/mídia, cartão de contato e templates aprovados pela Meta
  continuam **só para WhatsApp** nesta primeira versão — se tentado numa
  conversa de Instagram/Facebook, o CRM avisa que ainda não dá pra fazer
  isso ali, em vez de tentar e dar erro confuso.

### O que ficou de fora da v1 (de propósito, pra manter o escopo controlável)
- Envio de imagem/vídeo/áudio/documento pro Instagram/Facebook.
- Nome do contato: tentamos buscar o nome real via Graph API; se a Meta
  não liberar essa permissão (é bem restrita hoje em dia), o contato entra
  como "Contato do Instagram"/"Contato do Facebook" e o atendente pode
  renomear manualmente.
- Reações, "visto por", confirmação de entrega.
- Comentários públicos em posts (isso é uma API diferente da de mensagens
  diretas — se vocês quiserem isso também, é um projeto à parte).

## O que só você consegue fazer (contas da Meta)

Você marcou que já tem a Página do Facebook e o Instagram profissional, mas
ainda não mexeu no app da Meta. Passo a passo:

1. **App da Meta**: em https://developers.facebook.com/apps, use um app
   existente (pode ser o mesmo do WhatsApp Cloud API) ou crie um novo.
   Adicione os produtos **Messenger** e **Instagram** ao app.
2. **Conectar a Página**: no produto Messenger, em "Configuração do
   Access Token", conecte a Página do Facebook. Isso também conecta o
   Instagram profissional automaticamente, se ele já estiver vinculado a
   essa Página (Meta Business Suite → Configurações → Contas conectadas).
3. **Gerar o Page Access Token**: token de longa duração (idealmente que
   não expira, gerado via um System User no Business Manager, do mesmo
   jeito que provavelmente já foi feito pro token do WhatsApp).
4. **Webhook**: em Messenger → Webhooks (e também em Instagram → Webhooks,
   se aparecer separado), configure:
   - Callback URL: a mesma da API (`.../api/wa/webhook`)
   - Verify Token: o valor que você vai cadastrar no CRM ao criar a conta
     social (endpoint `/api/social-accounts`, campo `webhookVerifyToken`)
   - Campos: marque `messages` (Messenger) e `messages` (Instagram)
5. **Permissões necessárias**: `pages_messaging`, `pages_show_list`,
   `instagram_basic`, `instagram_manage_messages`. Como a Página é sua
   (você é admin), dá pra testar em modo de desenvolvimento sem passar
   pela revisão completa do app antes de ir pra produção — mas pra usar
   com clientes reais em produção, a Meta pode exigir revisão (App Review)
   dessas permissões. Vale confirmar isso na documentação mais recente
   quando chegar nessa etapa, porque a Meta muda esse processo com
   frequência.
6. Depois de ter o Page ID e o Page Access Token em mãos, me avise que eu
   cadastro a conta social no CRM (via `/api/social-accounts`) — ou você
   mesmo faz isso quando a tela de Configurações ganhar um formulário para
   isso (ainda não construí essa tela; hoje o cadastro é só por API/Prisma
   Studio, é um bom próximo passo).

## Como testar isso sem afetar a produção

1. **Frontend**: a Vercel já publica automaticamente uma "Preview
   Deployment" pra qualquer branch que não seja `main` — assim que eu
   empurrar `feature/instagram-facebook-inbox` pro GitHub, uma URL de teste
   deve aparecer no painel da Vercel (Deployments), sem tocar em
   `sol-crm-eight.vercel.app`.
2. **Backend (API)**: hoje ele roda no Render, e o `render.yaml` do
   projeto manda rodar a migração do banco (`npm run migrate:prod`) a cada
   deploy. Pra testar com segurança total, o ideal é:
   - Criar um **novo serviço no Render** (Web Service → mesmo repositório
     → branch `feature/instagram-facebook-inbox`), OU usar o recurso de
     "Preview Environments" do Render se o plano de vocês tiver isso.
   - Apontar esse serviço novo pra um **banco de dados separado** (um
     Postgres novo, de teste) — pode ser um banco novo no Render, no
     Supabase (gratuito) ou no Neon. Assim a migração roda num banco de
     teste, não no de produção.
   - Como as mudanças de schema são só aditivas, rodar a migração
     diretamente no banco de produção também não deveria quebrar nada — mas
     como isso é justamente o tipo de mudança que a "versão paralela" que
     você pediu é pra evitar, recomendo testar primeiro no banco separado.
3. Depois de validar que Instagram/Facebook estão entrando e sendo
   respondidos corretamente no ambiente de teste, é só fazer o merge desta
   branch pra `main` — aí sim a Vercel/Render publicam em produção.

## Variáveis de ambiente novas (opcional)

- `META_GRAPH_API_VERSION` (opcional, padrão `v21.0`): versão da Graph API
  usada para enviar mensagens. Ajustável sem precisar mexer no código.

Nenhuma variável de ambiente NOVA é obrigatória além dessa — as credenciais
de cada Página/Instagram ficam guardadas no banco (tabela
`social_accounts`), não em variável de ambiente, seguindo o mesmo padrão
das contas WhatsApp.
