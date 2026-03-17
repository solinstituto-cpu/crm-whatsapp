# Permissões de Usuários - DRM CRM

## Perfis (Roles) existentes

| Perfil | Descrição |
|--------|-----------|
| **ADMIN** | Administrador — acesso total ao sistema |
| **SUPERVISOR** | Supervisor — gerencia atendentes e visualiza relatórios |
| **AGENT** | Atendente — realiza atendimentos aos clientes |
| **VIEWER** | Visualizador — apenas visualiza informações |

---

## Matriz de Permissões por Módulo

| Módulo | ADMIN | SUPERVISOR | AGENT | VIEWER |
|--------|:-----:|:----------:|:-----:|:------:|
| **Dashboard** | ✅ Completo | ✅ Completo | ✅ Básico | ✅ Apenas visão |
| **Inbox** | ✅ Total | ✅ Total | ✅ Atribuídas a ele | 👁️ Só leitura |
| **Contatos** | ✅ CRUD total | ✅ CRUD total | ✅ CRUD (próprios) | 👁️ Só leitura |
| **Pipeline** | ✅ Total | ✅ Total | ✅ Editar deals | 👁️ Só leitura |
| **Templates** | ✅ CRUD | ✅ Visualizar | ✅ Usar em envios | 👁️ Só leitura |
| **Automação** | ✅ CRUD | ✅ Visualizar/Editar | 👁️ Só leitura | ❌ Sem acesso |
| **Base de Conhecimento** | ✅ CRUD | ✅ CRUD | ✅ Usar (IA) | 👁️ Só leitura |
| **Campanhas** | ✅ CRUD | ✅ Criar/Enviar | ✅ Enviar (se permitido) | ❌ Sem acesso |
| **Relatórios** | ✅ Total | ✅ Total | 👁️ Básico | 👁️ Básico |
| **Usuários** | ✅ CRUD | ✅ Ver/Editar (não admin) | ❌ Sem acesso | ❌ Sem acesso |
| **Configurações** | ✅ Total | 👁️ Parcial | ❌ Sem acesso | ❌ Sem acesso |
| **Contas WhatsApp** | ✅ Total | ✅ Ver/Testar | ❌ Sem acesso | ❌ Sem acesso |

---

## Detalhamento por perfil

### ADMIN
- Acesso total a todos os módulos
- Criar, editar e excluir usuários
- Configurações do sistema (empresa, integrações, contas WhatsApp)
- Gerenciar automações, campanhas e templates

### SUPERVISOR
- Visualiza e edita conversas de todos os atendentes
- Gerencia contatos e pipeline
- Cria e envia campanhas
- Visualiza e edita automações
- Acessa relatórios completos
- Pode ver/editar usuários (exceto promover a ADMIN)
- Configurações parciais (ex: respostas rápidas)

### AGENT
- Inbox: apenas conversas atribuídas a ele
- Contatos: criar, editar (próprios ou atribuídos)
- Pipeline: mover deals, editar
- Templates: usar em envios
- Base de conhecimento: usar na IA
- Relatórios: visão básica (próprias métricas)

### VIEWER
- Apenas leitura em Dashboard, Inbox, Contatos, Pipeline, Templates, Base de Conhecimento, Relatórios
- Não pode enviar mensagens, criar campanhas ou editar dados

---

## Onde configurar

1. **Criação de usuário** (Usuários → Novo) — já define o perfil (role)
2. **Edição de usuário** — admin/supervisor pode alterar o perfil
3. **Configurações** — futuramente: permissões granulares por módulo
