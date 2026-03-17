'use client'

import { useState } from 'react'
import {
  Home,
  MessageSquare,
  Users,
  TrendingUp,
  FileText,
  Zap,
  BookOpen,
  Megaphone,
  BarChart3,
  UserCog,
  Settings,
  HelpCircle,
} from 'lucide-react'

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'inbox', name: 'Inbox', icon: MessageSquare },
  { id: 'contacts', name: 'Contatos', icon: Users },
  { id: 'pipeline', name: 'Pipeline', icon: TrendingUp },
  { id: 'templates', name: 'Templates', icon: FileText },
  { id: 'automation', name: 'Automação', icon: Zap },
  { id: 'knowledge', name: 'Base de Conhecimento', icon: BookOpen },
  { id: 'campaigns', name: 'Campanhas', icon: Megaphone },
  { id: 'reports', name: 'Relatórios', icon: BarChart3 },
  { id: 'users', name: 'Usuários', icon: UserCog },
  { id: 'settings', name: 'Configurações', icon: Settings },
  { id: 'help', name: 'Ajuda', icon: HelpCircle },
]

interface InteractiveMockupProps {
  compact?: boolean
}

export default function InteractiveMockup({ compact = false }: InteractiveMockupProps) {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <div className={`w-full mx-auto ${compact ? 'max-w-4xl' : 'max-w-5xl'}`}>
      {/* Browser frame */}
      <div className={`bg-slate-800 rounded-t-xl overflow-hidden shadow-2xl border border-slate-700 ${compact ? 'rounded-b-xl' : ''}`}>
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-700">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-slate-700/50 rounded-lg px-4 py-1.5 text-slate-400 text-sm max-w-md w-full text-center">
              crm.drmschool.com.br
            </div>
          </div>
        </div>

        <div className={`flex ${compact ? 'min-h-[320px]' : 'min-h-[420px]'}`}>
          {/* Sidebar mock */}
          <div className={`bg-slate-900 border-r border-slate-700 flex-shrink-0 ${compact ? 'w-40' : 'w-48'}`}>
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold text-sm truncate">DRM CRM</span>
              </div>
            </div>
            <nav className={`p-2 space-y-0.5 overflow-y-auto ${compact ? 'max-h-[260px]' : 'max-h-[360px]'}`}>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    activePage === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
            {activePage === 'dashboard' && <MockDashboard />}
            {activePage === 'inbox' && <MockInbox />}
            {activePage === 'contacts' && <MockContacts />}
            {activePage === 'pipeline' && <MockPipeline />}
            {activePage === 'templates' && <MockTemplates />}
            {activePage === 'automation' && <MockAutomation />}
            {activePage === 'knowledge' && <MockKnowledge />}
            {activePage === 'campaigns' && <MockCampaigns />}
            {activePage === 'reports' && <MockReports />}
            {activePage === 'users' && <MockUsers />}
            {activePage === 'settings' && <MockSettings />}
            {activePage === 'help' && <MockHelp />}
          </div>
        </div>
      </div>

      {!compact && (
        <p className="text-center text-slate-500 text-sm mt-4">
          Clique nos itens do menu para explorar o sistema
        </p>
      )}
    </div>
  )
}

function MockDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Dashboard</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Contatos', value: '1.247', color: 'bg-blue-100 text-blue-700' },
          { label: 'Conversas ativas', value: '23', color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Deals abertos', value: 'R$ 45k', color: 'bg-amber-100 text-amber-700' },
          { label: 'Receita', value: 'R$ 12k', color: 'bg-indigo-100 text-indigo-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Atividade recente</p>
          <div className="space-y-2">
            {['Nova mensagem de Maria', 'Contato João adicionado', 'Deal fechado - R$ 2.500'].map((a, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                <span className="text-slate-600">{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Usuários online</p>
          <div className="flex gap-2">
            {['A', 'B', 'C'].map((l, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MockInbox() {
  return (
    <div className="flex gap-3 h-full">
      <div className="w-1/3 bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-2 border-b border-slate-200">
          <div className="h-8 bg-slate-100 rounded" />
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { name: 'Maria Silva', msg: 'Olá, gostaria de saber...', unread: true },
            { name: 'João Santos', msg: 'Obrigado pelo retorno!', unread: false },
            { name: 'Ana Costa', msg: 'Qual o valor do plano?', unread: true },
          ].map((c, i) => (
            <div key={i} className={`p-3 cursor-pointer ${c.unread ? 'bg-indigo-50' : ''}`}>
              <div className="flex justify-between">
                <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                {c.unread && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
              </div>
              <p className="text-xs text-slate-500 truncate">{c.msg}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-white rounded-lg border border-slate-200 flex flex-col">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500" />
          <div>
            <p className="font-medium text-slate-800 text-sm">Maria Silva</p>
            <p className="text-xs text-slate-500">online</p>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          <div className="flex justify-start">
            <div className="bg-slate-200 rounded-lg px-3 py-2 max-w-[80%] text-sm text-slate-700">
              Olá! Gostaria de saber mais sobre os planos.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-emerald-500 rounded-lg px-3 py-2 max-w-[80%] text-sm text-white">
              Olá Maria! Claro, temos planos a partir de R$ 147/mês...
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-slate-200 rounded-lg px-3 py-2 max-w-[80%] text-sm text-slate-700">
              Perfeito! Quero começar.
            </div>
          </div>
        </div>
        <div className="p-2 border-t border-slate-200">
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function MockContacts() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Contatos</h2>
        <div className="h-9 w-24 bg-indigo-600 rounded-lg" />
      </div>
      <div className="h-10 bg-slate-100 rounded-lg w-64" />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left p-3 font-medium text-slate-600">Nome</th>
              <th className="text-left p-3 font-medium text-slate-600">Telefone</th>
              <th className="text-left p-3 font-medium text-slate-600">Tags</th>
            </tr>
          </thead>
          <tbody>
            {['Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Lima', 'Carla Souza'].map((n, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-slate-800">{n}</td>
                <td className="p-3 text-slate-600">(11) 9xxxx-xxxx</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">Lead</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MockPipeline() {
  const stages = ['Qualificação', 'Proposta', 'Negociação', 'Fechado']
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Pipeline de Vendas</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((s, i) => (
          <div key={i} className="flex-1 min-w-[180px] bg-slate-100 rounded-lg p-3 border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">{s}</p>
            <div className="space-y-2">
              <div className="bg-white rounded p-2 border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-800">Deal exemplo</p>
                <p className="text-xs text-slate-500">R$ 1.500</p>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-800">Outro deal</p>
                <p className="text-xs text-slate-500">R$ 800</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockTemplates() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Templates</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'boas_vindas', status: 'Aprovado', cat: 'Marketing' },
          { name: 'lembrete_consulta', status: 'Aprovado', cat: 'Utility' },
          { name: 'promocao_mensal', status: 'Pendente', cat: 'Marketing' },
        ].map((t, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="font-medium text-slate-800 text-sm">{t.name}</p>
            <p className="text-xs text-slate-500">{t.cat}</p>
            <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockAutomation() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Automação</h2>
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white text-xl font-bold">1</div>
          <div className="flex-1 h-4 bg-slate-200 rounded w-32" />
          <div className="w-8 h-8 border-2 border-dashed border-slate-300 rounded" />
          <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white text-xl font-bold">2</div>
          <div className="flex-1 h-4 bg-slate-200 rounded w-40" />
          <div className="w-8 h-8 border-2 border-dashed border-slate-300 rounded" />
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <Zap className="h-6 w-6" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">Fluxo: Nova mensagem → Enviar saudação → Aguardar resposta</p>
      </div>
      <div className="flex gap-2">
        {['Boas-vindas', 'Fora do horário', 'Qualificação'].map((n, i) => (
          <div key={i} className="px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">{n}</div>
        ))}
      </div>
    </div>
  )
}

function MockKnowledge() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Base de Conhecimento</h2>
      <div className="space-y-2">
        {[
          { title: 'Como conectar o WhatsApp', cat: 'Configuração' },
          { title: 'Política de trocas', cat: 'Vendas' },
          { title: 'Horário de atendimento', cat: 'Geral' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-800 text-sm">{k.title}</p>
              <p className="text-xs text-slate-500">{k.cat}</p>
            </div>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MockCampaigns() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Campanhas</h2>
      <div className="space-y-2">
        {[
          { name: 'Black Friday', status: 'Em execução', sent: 1.2, delivered: 0.9 },
          { name: 'Lembrete matrícula', status: 'Agendada', sent: 0, delivered: 0 },
          { name: 'Promo verão', status: 'Concluída', sent: 0.5, delivered: 0.4 },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-800 text-sm">{c.name}</p>
              <p className="text-xs text-slate-500">{c.sent}k enviados · {c.delivered}k entregues</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${c.status === 'Em execução' ? 'bg-emerald-100 text-emerald-700' : c.status === 'Agendada' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockReports() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Relatórios</h2>
      <div className="grid grid-cols-3 gap-3">
        {['Contatos', 'Conversas', 'Receita'].map((r, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">{r}</p>
            <p className="text-xl font-bold text-indigo-600">{i === 0 ? '1.247' : i === 1 ? '342' : 'R$ 12k'}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg p-4 border border-slate-200 h-32">
        <div className="h-full bg-slate-100 rounded flex items-center justify-center text-slate-400 text-sm">
          Gráfico de mensagens
        </div>
      </div>
    </div>
  )
}

function MockUsers() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Usuários</h2>
      <div className="space-y-2">
        {[
          { name: 'Admin', email: 'admin@empresa.com', role: 'Admin', online: true },
          { name: 'Atendente 1', email: 'at1@empresa.com', role: 'Agente', online: true },
          { name: 'Atendente 2', email: 'at2@empresa.com', role: 'Agente', online: false },
        ].map((u, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
              {u.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800 text-sm">{u.name}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <span className={`w-2 h-2 rounded-full ${u.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockSettings() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Configurações</h2>
      <div className="space-y-2">
        {['Sistema', 'Aparência', 'Campos', 'Integrações', 'Contas WhatsApp'].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 flex justify-between items-center">
            <span className="text-slate-800 text-sm">{s}</span>
            <div className="w-4 h-4 border border-slate-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MockHelp() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Ajuda</h2>
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-slate-600 text-sm mb-4">Encontre respostas e suporte para usar o DRM CRM.</p>
        <div className="space-y-2">
          {['Como conectar meu WhatsApp?', 'Como criar uma campanha?', 'Como configurar automações?'].map((q, i) => (
            <div key={i} className="p-2 bg-slate-50 rounded text-sm text-slate-700">{q}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
