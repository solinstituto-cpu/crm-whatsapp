'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Clock,
  Users,
  ChevronRight,
  ArrowRight,
  GitBranch,
  Tag,
  Bell,
  Bot,
  Timer,
  Save,
  X,
  Settings,
  Copy,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Sparkles,
  MousePointerClick,
  List,
  Sheet,
  UserCheck
} from 'lucide-react'

// Tipos
interface FlowNode {
  id: string
  flowId: string
  type: string
  name: string
  position: number
  config: any
  nextNodeId?: string
}

interface Flow {
  id: string
  name: string
  description?: string
  isActive: boolean
  trigger: string
  triggerConfig: any
  executionCount: number
  lastExecutedAt?: string
  nodes: FlowNode[]
  _count?: { sessions: number }
}

// Tipos de nós disponíveis
const NODE_TYPES = [
  { type: 'SEND_MESSAGE', name: 'Enviar Mensagem', icon: MessageSquare, color: 'bg-blue-500' },
  { type: 'INTERACTIVE_BUTTONS', name: 'Botões Interativos', icon: MousePointerClick, color: 'bg-indigo-500' },
  { type: 'INTERACTIVE_LIST', name: 'Lista Interativa', icon: List, color: 'bg-cyan-500' },
  { type: 'WAIT_RESPONSE', name: 'Aguardar Resposta', icon: Clock, color: 'bg-yellow-500' },
  { type: 'CONDITION', name: 'Condição', icon: GitBranch, color: 'bg-purple-500' },
  { type: 'DELAY', name: 'Aguardar', icon: Timer, color: 'bg-orange-500' },
  { type: 'ADD_TAG', name: 'Adicionar Tag', icon: Tag, color: 'bg-green-500' },
  { type: 'AI_RESPONSE', name: 'Resposta IA', icon: Bot, color: 'bg-pink-500' },
  { type: 'AI_CHATBOT', name: 'Chatbot IA', icon: Sparkles, color: 'bg-violet-500' },
  { type: 'NOTIFY', name: 'Notificar', icon: Bell, color: 'bg-red-500' },
  { type: 'COLLECT_DATA', name: 'Coletar Dados', icon: Users, color: 'bg-teal-500' },
  { type: 'GOOGLE_SHEETS', name: 'Google Sheets', icon: Sheet, color: 'bg-emerald-500' },
  { type: 'ASSIGN_AGENT', name: 'Atribuir Atendente', icon: UserCheck, color: 'bg-amber-500' },
  { type: 'HTTP_REQUEST', name: 'Requisição HTTP', icon: Zap, color: 'bg-slate-500' },
  { type: 'UPDATE_CONTACT', name: 'Atualizar Contato', icon: Users, color: 'bg-lime-500' },
]

// Tipos de gatilhos
const TRIGGER_TYPES = [
  { type: 'KEYWORD', name: 'Palavra-chave', description: 'Quando mensagem contém palavra específica' },
  { type: 'NEW_MESSAGE', name: 'Nova mensagem', description: 'Qualquer nova mensagem recebida' },
  { type: 'NEW_CONTACT', name: 'Novo contato', description: 'Quando um novo contato é criado' },
  { type: 'BUTTON_CLICK', name: 'Clique em botão', description: 'Quando cliente clica em botão de template' },
  { type: 'OUTSIDE_HOURS', name: 'Fora do horário', description: 'Quando mensagem chega fora do horário comercial' },
  { type: 'NO_RESPONSE_24H', name: 'Sem resposta 24h', description: 'Follow-up automático após 24h sem resposta' },
  { type: 'BIRTHDAY', name: 'Aniversário', description: 'Mensagem automática no aniversário do contato' },
]

// Helper para formatar descrição do trigger
const formatTriggerDescription = (flow: Flow): string => {
  const triggerName = TRIGGER_TYPES.find(t => t.type === flow.trigger)?.name || flow.trigger
  const config = flow.triggerConfig || {}
  
  let details: string[] = []
  
  // Keywords
  if (flow.trigger === 'KEYWORD' && config.keywords?.length > 0) {
    details.push(`"${config.keywords.join('", "')}"`)
  }
  
  // Cooldown (tempo entre execuções por contato)
  if (config.cooldownHours && config.cooldownHours > 0) {
    details.push(`⏱️ ${config.cooldownHours}h entre execuções`)
  }
  
  // Horário comercial
  if (config.businessHoursOnly && config.businessHoursStart && config.businessHoursEnd) {
    details.push(`🕐 ${config.businessHoursStart}-${config.businessHoursEnd}`)
  }
  
  if (details.length > 0) {
    return `${triggerName} • ${details.join(' • ')}`
  }
  
  return triggerName
}

// Templates prontos de automação
const FLOW_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Mensagem automática para novos contatos',
    icon: '👋',
    trigger: 'NEW_CONTACT',
    triggerConfig: { cooldownHours: 0 },
    nodes: [
      {
        type: 'SEND_MESSAGE',
        name: 'Mensagem de boas-vindas',
        config: {
          messageType: 'text',
          messageContent: 'Olá {nome}! 👋\n\nSeja bem-vindo(a)! Sou o assistente virtual e estou aqui para ajudar.\n\nComo posso te ajudar hoje?'
        }
      }
    ]
  },
  {
    id: 'outside_hours',
    name: 'Fora do Horário',
    description: 'Resposta automática fora do expediente',
    icon: '🌙',
    trigger: 'OUTSIDE_HOURS',
    triggerConfig: { businessHoursStart: 8, businessHoursEnd: 18 },
    nodes: [
      {
        type: 'SEND_MESSAGE',
        name: 'Mensagem fora do horário',
        config: {
          messageType: 'text',
          messageContent: 'Olá! 🌙\n\nObrigado por entrar em contato.\n\nNosso horário de atendimento é de segunda a sexta, das 8h às 18h.\n\nDeixe sua mensagem que responderemos assim que possível!'
        }
      }
    ]
  },
  {
    id: 'lead_qualification',
    name: 'Qualificação de Lead',
    description: 'Coleta de informações do potencial cliente',
    icon: '📋',
    trigger: 'KEYWORD',
    triggerConfig: { keywords: ['informações', 'saber mais', 'quero conhecer'], cooldownHours: 24 },
    nodes: [
      {
        type: 'SEND_MESSAGE',
        name: 'Saudação',
        config: {
          messageType: 'text',
          messageContent: 'Ótimo! Vou te ajudar com algumas informações. 😊\n\nPrimeiro, qual é o seu nome completo?'
        }
      },
      {
        type: 'COLLECT_DATA',
        name: 'Coletar nome',
        config: {
          fieldName: 'Me diga seu nome:',
          saveAs: 'nome_completo'
        }
      },
      {
        type: 'COLLECT_DATA',
        name: 'Coletar interesse',
        config: {
          fieldName: 'E qual serviço você tem interesse?',
          saveAs: 'interesse_servico'
        }
      },
      {
        type: 'SEND_MESSAGE',
        name: 'Agradecimento',
        config: {
          messageType: 'text',
          messageContent: 'Perfeito! Obrigado pelas informações.\n\nUm de nossos atendentes entrará em contato em breve! 🙌'
        }
      },
      {
        type: 'ADD_TAG',
        name: 'Adicionar tag',
        config: {
          tagName: 'lead_qualificado'
        }
      }
    ]
  },
  {
    id: 'chatbot_ai',
    name: 'Chatbot Inteligente',
    description: 'IA conversa até pedir atendente humano',
    icon: '🤖',
    trigger: 'NEW_MESSAGE',
    triggerConfig: { cooldownHours: 0 },
    nodes: [
      {
        type: 'AI_CHATBOT',
        name: 'Chatbot IA',
        config: {
          aiPrompt: `Você é um assistente virtual inteligente e prestativo.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja educado, objetivo e prestativo
- Respostas curtas (2-3 linhas)
- Se não souber algo, diga que vai verificar
- Se pedirem para falar com humano, diga que vai transferir

IMPORTANTE: Converse naturalmente até o cliente pedir um atendente.`,
          aiModel: 'gpt-3.5-turbo',
          aiMaxTokens: 500,
          historyLimit: 15,
          useKnowledge: true
        }
      }
    ]
  },
  {
    id: 'menu_options',
    name: 'Menu de Opções',
    description: 'Menu interativo com botões',
    icon: '📱',
    trigger: 'KEYWORD',
    triggerConfig: { keywords: ['menu', 'opções', 'início'], cooldownHours: 0 },
    nodes: [
      {
        type: 'INTERACTIVE_BUTTONS',
        name: 'Menu principal',
        config: {
          bodyText: 'Olá! Como posso ajudar?\n\nEscolha uma opção:',
          footerText: 'Responda com o número da opção',
          buttons: [
            { id: 'btn_info', title: '📋 Informações' },
            { id: 'btn_prices', title: '💰 Preços' },
            { id: 'btn_contact', title: '👤 Falar com atendente' }
          ]
        }
      }
    ]
  },
  {
    id: 'birthday',
    name: 'Feliz Aniversário',
    description: 'Mensagem automática de aniversário',
    icon: '🎂',
    trigger: 'BIRTHDAY',
    triggerConfig: {},
    nodes: [
      {
        type: 'SEND_MESSAGE',
        name: 'Parabéns',
        config: {
          messageType: 'text',
          messageContent: '🎂 Feliz Aniversário, {nome}! 🎉\n\nDesejamos um dia repleto de alegrias e realizações!\n\nComo presente, preparamos uma surpresa especial para você. Entre em contato para saber mais! 🎁'
        }
      },
      {
        type: 'ADD_TAG',
        name: 'Tag aniversário',
        config: {
          tagName: 'aniversario_2026'
        }
      }
    ]
  }
]

export default function AutomationPage() {
  const { data: session, status } = useSession()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [showFlowEditor, setShowFlowEditor] = useState(false)
  const [showNewFlowModal, setShowNewFlowModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, expired: 0 })
  const [contactFieldOptions, setContactFieldOptions] = useState<{id: string, name: string, value: string}[]>([])
  const [availableAgents, setAvailableAgents] = useState<{id: string, name: string, email: string, color?: string}[]>([])

  // Form para novo fluxo
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [newFlowTrigger, setNewFlowTrigger] = useState('KEYWORD')
  const [newFlowKeywords, setNewFlowKeywords] = useState<string[]>([])
  const [newFlowKeywordInput, setNewFlowKeywordInput] = useState('')
  const [newFlowKeywordMode, setNewFlowKeywordMode] = useState<'contains' | 'exact'>('contains')
  const [newFlowCooldown, setNewFlowCooldown] = useState(24)
  const [newFlowBusinessHours, setNewFlowBusinessHours] = useState(false)
  const [newFlowBusinessStart, setNewFlowBusinessStart] = useState(8)
  const [newFlowBusinessEnd, setNewFlowBusinessEnd] = useState(18)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFlows()
      fetchStats()
      fetchContactFieldOptions()
      fetchAvailableAgents()
    }
  }, [status])

  const fetchAvailableAgents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/users`)
      if (response.ok) {
        const data = await response.json()
        setAvailableAgents(data.map((u: any) => ({ id: u.id, name: u.name, email: u.email, color: u.color })))
      }
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error)
    }
  }

  const fetchContactFieldOptions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/settings/field-options/contactField`)
      if (response.ok) {
        const data = await response.json()
        setContactFieldOptions(data.map((o: any) => ({ id: o.id, name: o.label, value: o.value })))
      }
    } catch (error) {
      console.error('Erro ao carregar campos de coleta:', error)
    }
  }

  const fetchFlows = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows`)
      if (response.ok) {
        const data = await response.json()
        setFlows(data.map((f: any) => ({
          ...f,
          triggerConfig: typeof f.triggerConfig === 'string' ? JSON.parse(f.triggerConfig) : f.triggerConfig,
          nodes: f.nodes?.map((n: any) => ({
            ...n,
            config: typeof n.config === 'string' ? JSON.parse(n.config) : n.config,
          })) || [],
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows/stats`)
      if (response.ok) {
        setStats(await response.json())
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const fetchActiveSessions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows/sessions/active`)
      if (response.ok) {
        setActiveSessions(await response.json())
      }
    } catch (error) {
      console.error('Erro ao carregar sessões ativas:', error)
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows/sessions/${sessionId}/cancel`, {
        method: 'POST',
      })
      if (response.ok) {
        setActiveSessions(activeSessions.filter(s => s.id !== sessionId))
        fetchStats()
      }
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error)
    }
  }

  const handleCancelAllSessions = async () => {
    if (!confirm('Tem certeza que deseja cancelar TODAS as sessões ativas?')) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows/sessions/cancel-all`, {
        method: 'POST',
      })
      if (response.ok) {
        setActiveSessions([])
        fetchStats()
        alert('Todas as sessões foram canceladas!')
      }
    } catch (error) {
      console.error('Erro ao cancelar sessões:', error)
    }
  }

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlowName,
          description: newFlowDescription,
          trigger: newFlowTrigger,
          triggerConfig: {
            keywords: newFlowKeywords, // Já é um array, não precisa split
            keywordMatchMode: newFlowKeywordMode,
            cooldownHours: newFlowCooldown,
            businessHoursOnly: newFlowBusinessHours,
            businessHoursStart: newFlowBusinessStart,
            businessHoursEnd: newFlowBusinessEnd,
          },
        }),
      })

      if (response.ok) {
        const newFlow = await response.json()
        setFlows([...flows, { ...newFlow, nodes: [], triggerConfig: { keywords: [] } }])
        setShowNewFlowModal(false)
        setNewFlowName('')
        setNewFlowDescription('')
        setNewFlowKeywords([])
        setNewFlowKeywordInput('')
        setNewFlowKeywordMode('contains')
        setNewFlowCooldown(24)
        setNewFlowBusinessHours(false)
        // Abrir editor do novo fluxo
        setSelectedFlow({ ...newFlow, nodes: [], triggerConfig: { keywords: [] } })
        setShowFlowEditor(true)
      }
    } catch (error) {
      console.error('Erro ao criar fluxo:', error)
      alert('Erro ao criar fluxo')
    } finally {
      setSaving(false)
    }
  }

  // Criar fluxo a partir de um template
  const handleCreateFromTemplate = async (template: typeof FLOW_TEMPLATES[0]) => {
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      
      // 1. Criar o fluxo
      const flowResponse = await fetch(`${apiUrl}/api/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          triggerConfig: template.triggerConfig,
        }),
      })

      if (!flowResponse.ok) {
        throw new Error('Erro ao criar fluxo')
      }

      const newFlow = await flowResponse.json()

      // 2. Criar os nós do template
      let prevNodeId: string | null = null
      const createdNodes = []

      for (let i = 0; i < template.nodes.length; i++) {
        const nodeTemplate = template.nodes[i]
        
        const nodeResponse = await fetch(`${apiUrl}/api/flows/${newFlow.id}/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: nodeTemplate.type,
            name: nodeTemplate.name,
            position: i,
            config: nodeTemplate.config,
          }),
        })

        if (nodeResponse.ok) {
          const createdNode = await nodeResponse.json()
          createdNodes.push(createdNode)
          
          // Conectar nó anterior ao atual
          if (prevNodeId) {
            await fetch(`${apiUrl}/api/flows/nodes/${prevNodeId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nextNodeId: createdNode.id }),
            })
          }
          
          prevNodeId = createdNode.id
        }
      }

      // 3. Atualizar lista e abrir editor
      const completeFlow = {
        ...newFlow,
        nodes: createdNodes.map((n: any) => ({
          ...n,
          config: typeof n.config === 'string' ? JSON.parse(n.config) : n.config,
        })),
        triggerConfig: template.triggerConfig,
      }
      
      setFlows([...flows, completeFlow])
      setShowTemplatesModal(false)
      setSelectedFlow(completeFlow)
      setShowFlowEditor(true)
      
      // Feedback
      alert(`✅ Fluxo "${template.name}" criado com sucesso!`)
    } catch (error) {
      console.error('Erro ao criar fluxo do template:', error)
      alert('Erro ao criar fluxo do template')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleFlow = async (flowId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows/${flowId}/toggle`, {
        method: 'POST',
      })
      if (response.ok) {
        setFlows(flows.map(f => 
          f.id === flowId ? { ...f, isActive: !f.isActive } : f
        ))
      }
    } catch (error) {
      console.error('Erro ao alternar fluxo:', error)
    }
  }

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      await fetch(`${apiUrl}/api/flows/${flowId}`, { method: 'DELETE' })
      setFlows(flows.filter(f => f.id !== flowId))
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null)
        setShowFlowEditor(false)
      }
    } catch (error) {
      console.error('Erro ao excluir fluxo:', error)
    }
  }

  const handleOpenEditor = (flow: Flow) => {
    setSelectedFlow(flow)
    setShowFlowEditor(true)
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    )
  }

  // Editor de Fluxo
  if (showFlowEditor && selectedFlow) {
    return (
      <DashboardLayout>
        <FlowEditor 
          flow={selectedFlow} 
          onClose={() => {
            setShowFlowEditor(false)
            setSelectedFlow(null)
            fetchFlows()
          }}
          onUpdate={(updatedFlow) => {
            setSelectedFlow(updatedFlow)
            setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f))
          }}
          contactFieldOptions={contactFieldOptions}
          availableAgents={availableAgents}
        />
      </DashboardLayout>
    )
  }

  // Lista de Fluxos
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automação</h1>
              <p className="text-gray-600">Configure fluxos de automação para WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowTemplatesModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 flex items-center space-x-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>Templates</span>
            </button>
            <button 
              onClick={() => setShowNewFlowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Fluxo</span>
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fluxos Ativos</p>
              <p className="text-2xl font-bold">{flows.filter(f => f.isActive).length}</p>
            </div>
          </div>
          <div 
            onClick={() => { fetchActiveSessions(); setShowSessionsModal(true); }}
            className="bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4 cursor-pointer hover:bg-blue-50 transition-colors"
            title="Clique para ver e gerenciar sessões ativas"
          >
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessões Ativas</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Concluídos</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Execuções</p>
              <p className="text-2xl font-bold">{flows.reduce((acc, f) => acc + f.executionCount, 0)}</p>
            </div>
          </div>
        </div>

        {/* Lista de Fluxos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Fluxos de Automação</h2>
          </div>
          
          {flows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Zap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Nenhum fluxo criado ainda</p>
              <p className="text-sm mt-1">Clique em "Novo Fluxo" para começar</p>
            </div>
          ) : (
            <div className="divide-y">
              {flows.map((flow) => (
                <div key={flow.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          flow.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {flow.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {flow.description && (
                        <p className="text-sm text-gray-500 mt-1">{flow.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <GitBranch className="h-4 w-4 mr-1" />
                          {flow.nodes.length} etapas
                        </span>
                        <span className="flex items-center">
                          <Play className="h-4 w-4 mr-1" />
                          {flow.executionCount}x executado
                        </span>
                        <span className="flex items-center text-green-600">
                          <Zap className="h-4 w-4 mr-1" />
                          {formatTriggerDescription(flow)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleFlow(flow.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          flow.isActive 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={flow.isActive ? 'Pausar' : 'Ativar'}
                      >
                        {flow.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleOpenEditor(flow)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Novo Fluxo */}
        {showNewFlowModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Novo Fluxo de Automação</h3>
                <button onClick={() => setShowNewFlowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fluxo *</label>
                  <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    placeholder="Ex: Boas-vindas Yoga"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={newFlowDescription}
                    onChange={(e) => setNewFlowDescription(e.target.value)}
                    placeholder="Descreva o objetivo deste fluxo..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gatilho</label>
                  <select
                    value={newFlowTrigger}
                    onChange={(e) => setNewFlowTrigger(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {TRIGGER_TYPES.map(t => (
                      <option key={t.type} value={t.type}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {TRIGGER_TYPES.find(t => t.type === newFlowTrigger)?.description}
                  </p>
                </div>
                {newFlowTrigger === 'KEYWORD' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                      <div className="space-y-2">
                        {/* Tags das keywords adicionadas */}
                        {newFlowKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                            {newFlowKeywords.map((kw, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {kw}
                                <button
                                  type="button"
                                  onClick={() => setNewFlowKeywords(newFlowKeywords.filter((_, i) => i !== idx))}
                                  className="ml-1 text-green-600 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Input para adicionar nova keyword */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFlowKeywordInput}
                            onChange={(e) => setNewFlowKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const kw = newFlowKeywordInput.trim()
                                if (kw && !newFlowKeywords.includes(kw)) {
                                  setNewFlowKeywords([...newFlowKeywords, kw])
                                  setNewFlowKeywordInput('')
                                }
                              }
                            }}
                            placeholder="Digite uma palavra ou frase e pressione Enter"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const kw = newFlowKeywordInput.trim()
                              if (kw && !newFlowKeywords.includes(kw)) {
                                setNewFlowKeywords([...newFlowKeywords, kw])
                                setNewFlowKeywordInput('')
                              }
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          💡 Você pode incluir vírgulas nas palavras-chave. Exemplo: "Olá, tudo bem?" será tratado como UMA palavra-chave completa.
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modo de correspondência</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="keywordMode"
                            value="contains"
                            checked={newFlowKeywordMode === 'contains'}
                            onChange={() => setNewFlowKeywordMode('contains')}
                            className="mr-2"
                          />
                          <span className="text-sm">Contém (palavra)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="keywordMode"
                            value="exact"
                            checked={newFlowKeywordMode === 'exact'}
                            onChange={() => setNewFlowKeywordMode('exact')}
                            className="mr-2"
                          />
                          <span className="text-sm">Exato (frase inteira)</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {newFlowKeywordMode === 'contains' 
                          ? 'Dispara se a mensagem contém a palavra (ex: "Sim" em "Sim, quero")' 
                          : 'Dispara apenas se a mensagem for EXATAMENTE igual à keyword'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Anti-spam */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anti-spam (horas entre execuções)
                  </label>
                  <input
                    type="number"
                    value={newFlowCooldown}
                    onChange={(e) => setNewFlowCooldown(parseInt(e.target.value) || 0)}
                    min={0}
                    max={168}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Evita que o mesmo contato dispare o fluxo repetidamente. 0 = sem limite.
                  </p>
                </div>

                {/* Horário comercial */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="businessHours"
                      checked={newFlowBusinessHours}
                      onChange={(e) => setNewFlowBusinessHours(e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-gray-300"
                    />
                    <label htmlFor="businessHours" className="ml-2 text-sm font-medium text-gray-700">
                      Executar apenas em horário comercial
                    </label>
                  </div>
                  {newFlowBusinessHours && (
                    <div className="flex items-center space-x-2 pl-6">
                      <input
                        type="number"
                        value={newFlowBusinessStart}
                        onChange={(e) => setNewFlowBusinessStart(parseInt(e.target.value) || 8)}
                        min={0}
                        max={23}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">às</span>
                      <input
                        type="number"
                        value={newFlowBusinessEnd}
                        onChange={(e) => setNewFlowBusinessEnd(parseInt(e.target.value) || 18)}
                        min={0}
                        max={23}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">h (seg-sex)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 p-4 border-t">
                <button
                  onClick={() => setShowNewFlowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFlow}
                  disabled={!newFlowName.trim() || saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar Fluxo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sessões Ativas */}
        {showSessionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Sessões Ativas ({activeSessions.length})</h3>
                <button onClick={() => setShowSessionsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma sessão ativa no momento</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.map((sess) => (
                      <div key={sess.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{sess.contactId}</p>
                          <p className="text-sm text-gray-500">
                            Fluxo: {sess.flow?.name || 'Desconhecido'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Iniciado: {new Date(sess.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelSession(sess.id)}
                          className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between p-4 border-t">
                <button
                  onClick={handleCancelAllSessions}
                  disabled={activeSessions.length === 0}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  Cancelar Todas
                </button>
                <button
                  onClick={() => { fetchActiveSessions(); fetchStats(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Templates Prontos */}
        {showTemplatesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-violet-500" />
                    Templates de Automação
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Escolha um template para começar rapidamente</p>
                </div>
                <button onClick={() => setShowTemplatesModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FLOW_TEMPLATES.map((template) => (
                    <div 
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{template.icon}</span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {TRIGGER_TYPES.find(t => t.type === template.trigger)?.name || template.trigger}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </p>
                      <div className="mt-3 flex items-center text-xs text-gray-400">
                        <span>{template.nodes.length} {template.nodes.length === 1 ? 'nó' : 'nós'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-violet-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-violet-800">Dica</h4>
                      <p className="text-sm text-violet-600 mt-1">
                        Após criar o fluxo a partir do template, você pode personalizar mensagens, 
                        adicionar ou remover nós, e configurar gatilhos específicos para seu negócio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// ==========================================
// COMPONENTE: EDITOR DE FLUXO
// ==========================================

interface FlowEditorProps {
  flow: Flow
  onClose: () => void
  onUpdate: (flow: Flow) => void
  contactFieldOptions: {id: string, name: string, value: string}[]
  availableAgents: {id: string, name: string, email: string, color?: string}[]
}

function FlowEditor({ flow, onClose, onUpdate, contactFieldOptions, availableAgents }: FlowEditorProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(flow.nodes)
  const [saving, setSaving] = useState(false)
  const [showAddNode, setShowAddNode] = useState(false)
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null)
  const [expandedNode, setExpandedNode] = useState<string | null>(null)

  const handleAddNode = async (type: string) => {
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const nodeData = {
        type,
        name: NODE_TYPES.find(n => n.type === type)?.name || type,
        position: nodes.length,
        config: getDefaultConfig(type),
      }
      
      const response = await fetch(`${apiUrl}/api/flows/${flow.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData),
      })

      if (response.ok) {
        const newNode = await response.json()
        const parsedNode = {
          ...newNode,
          config: typeof newNode.config === 'string' ? JSON.parse(newNode.config) : newNode.config,
        }
        setNodes([...nodes, parsedNode])
        setShowAddNode(false)
        setEditingNode(parsedNode)
      }
    } catch (error) {
      console.error('Erro ao adicionar nó:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNode = async (nodeId: string, configWithNextNodeId: any) => {
    setSaving(true)
    try {
      // Separar nextNodeId do config
      const { nextNodeId, ...config } = configWithNextNodeId
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/flows/nodes/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, nextNodeId }),
      })

      if (response.ok) {
        setNodes(nodes.map(n => n.id === nodeId ? { ...n, config, nextNodeId } : n))
        setEditingNode(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar nó:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Excluir esta etapa?')) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      await fetch(`${apiUrl}/api/flows/nodes/${nodeId}`, { method: 'DELETE' })
      setNodes(nodes.filter(n => n.id !== nodeId))
    } catch (error) {
      console.error('Erro ao excluir nó:', error)
    }
  }

  // Mover nó para cima (diminuir position)
  const handleMoveNodeUp = async (nodeId: string) => {
    const nodeIndex = nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex <= 0) return // Já é o primeiro
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const currentNode = nodes[nodeIndex]
      const previousNode = nodes[nodeIndex - 1]
      
      // Trocar posições
      const newNodes = [...nodes]
      newNodes[nodeIndex - 1] = { ...currentNode, position: previousNode.position }
      newNodes[nodeIndex] = { ...previousNode, position: currentNode.position }
      newNodes.sort((a, b) => a.position - b.position)
      
      // Atualizar no servidor
      await Promise.all([
        fetch(`${apiUrl}/api/flows/nodes/${currentNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: currentNode.config, position: previousNode.position })
        }),
        fetch(`${apiUrl}/api/flows/nodes/${previousNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: previousNode.config, position: currentNode.position })
        })
      ])
      
      setNodes(newNodes)
    } catch (error) {
      console.error('Erro ao mover nó:', error)
    }
  }

  // Mover nó para baixo (aumentar position)
  const handleMoveNodeDown = async (nodeId: string) => {
    const nodeIndex = nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex >= nodes.length - 1) return // Já é o último
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const currentNode = nodes[nodeIndex]
      const nextNode = nodes[nodeIndex + 1]
      
      // Trocar posições
      const newNodes = [...nodes]
      newNodes[nodeIndex] = { ...nextNode, position: currentNode.position }
      newNodes[nodeIndex + 1] = { ...currentNode, position: nextNode.position }
      newNodes.sort((a, b) => a.position - b.position)
      
      // Atualizar no servidor
      await Promise.all([
        fetch(`${apiUrl}/api/flows/nodes/${currentNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: currentNode.config, position: nextNode.position })
        }),
        fetch(`${apiUrl}/api/flows/nodes/${nextNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: nextNode.config, position: currentNode.position })
        })
      ])
      
      setNodes(newNodes)
    } catch (error) {
      console.error('Erro ao mover nó:', error)
    }
  }

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'SEND_MESSAGE':
        return { messageType: 'text', messageContent: '' }
      case 'INTERACTIVE_BUTTONS':
        return { 
          interactiveType: 'button',
          bodyText: '',
          footerText: '',
          buttons: [
            { id: 'btn_1', title: 'Opção 1', nextNodeId: null },
          ]
        }
      case 'INTERACTIVE_LIST':
        return { 
          interactiveType: 'list',
          bodyText: '',
          footerText: '',
          listButtonText: 'Ver opções',
          listSections: [
            { 
              title: 'Seção 1', 
              rows: [
                { id: 'row_1', title: 'Item 1', description: '', nextNodeId: null },
              ]
            }
          ]
        }
      case 'WAIT_RESPONSE':
        return { timeout: 60, saveAs: 'resposta' }
      case 'CONDITION':
        return { conditions: [], defaultNextNodeId: null }
      case 'DELAY':
        return { delayMinutes: 5 }
      case 'ADD_TAG':
        return { tagName: '' }
      case 'AI_RESPONSE':
        return { 
          aiPrompt: 'Você é um assistente virtual de atendimento. Seja educado, prestativo e objetivo. Responda em português brasileiro.',
          aiModel: 'gpt-3.5-turbo',
          aiMaxTokens: 500,
          aiTemperature: 0.7,
          useHistory: true,
          historyLimit: 10,
          useKnowledge: true,
          handoffAgentId: ''
        }
      case 'AI_CHATBOT':
        return {
          aiPrompt: `Você é um assistente virtual inteligente. Mantenha uma conversa natural e ajude o cliente.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja educado, prestativo e objetivo
- Respostas curtas (2-3 linhas no máximo)
- Se não souber algo, diga que vai verificar
- Se o cliente pedir para falar com humano, diga que vai transferir

IMPORTANTE: Você pode conversar livremente até o cliente pedir para falar com um atendente humano.`,
          aiModel: 'gpt-3.5-turbo',
          aiMaxTokens: 500,
          aiTemperature: 0.7,
          historyLimit: 15,
          useKnowledge: true,
          handoffAgentId: '',
          defaultAgentId: ''
        }
      case 'NOTIFY':
        return { notifyMessage: '' }
      case 'COLLECT_DATA':
        return { fieldName: '', fieldType: 'text', saveAs: '' }
      case 'GOOGLE_SHEETS':
        return { 
          spreadsheetId: '',
          sheetName: 'Sheet1',
          fields: [
            { column: 'A', field: 'nome', label: 'Nome' },
            { column: 'B', field: 'telefone', label: 'Telefone' },
          ]
        }
      case 'ASSIGN_AGENT':
        return {
          agentId: '',
          notifyAgent: true,
          notifyMessage: '🔔 Nova conversa atribuída a você!'
        }
      case 'HTTP_REQUEST':
        return {
          httpUrl: '',
          httpMethod: 'POST',
          httpHeaders: { 'Content-Type': 'application/json' },
          httpBody: '{\n  "telefone": "{telefone}",\n  "nome": "{nome}"\n}',
          saveResponseAs: ''
        }
      case 'UPDATE_CONTACT':
        return {
          updateFields: [
            { field: 'customerStatus', value: '' }
          ]
        }
      default:
        return {}
    }
  }

  const getNodeIcon = (type: string) => {
    const nodeType = NODE_TYPES.find(n => n.type === type)
    if (!nodeType) return MessageSquare
    return nodeType.icon
  }

  const getNodeColor = (type: string) => {
    const nodeType = NODE_TYPES.find(n => n.type === type)
    return nodeType?.color || 'bg-gray-500'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{flow.name}</h1>
            <p className="text-sm text-gray-500">{flow.description || 'Sem descrição'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            flow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {flow.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Nós */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-2xl mx-auto">
            {/* Gatilho */}
            <div className="bg-white rounded-lg border-2 border-green-500 p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Gatilho: {TRIGGER_TYPES.find(t => t.type === flow.trigger)?.name}</p>
                  {flow.trigger === 'KEYWORD' && flow.triggerConfig?.keywords?.length > 0 && (
                    <p className="text-sm text-green-600">
                      Palavras-chave: {flow.triggerConfig.keywords.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seta */}
            {nodes.length > 0 && (
              <div className="flex justify-center my-2">
                <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
              </div>
            )}

            {/* Nós */}
            {nodes.map((node, index) => {
              const NodeIcon = getNodeIcon(node.type)
              const isExpanded = expandedNode === node.id
              
              return (
                <div key={node.id}>
                  <div className={`bg-white rounded-lg border p-4 ${
                    editingNode?.id === node.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getNodeColor(node.type)}`}>
                          <NodeIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{node.name}</p>
                          <p className="text-sm text-gray-500">
                            {node.type === 'SEND_MESSAGE' && node.config?.messageContent && (
                              <span>"{node.config.messageContent.substring(0, 50)}..."</span>
                            )}
                            {node.type === 'INTERACTIVE_BUTTONS' && (
                              <span>
                                {node.config?.buttons?.length || 0} botões
                                {node.config?.bodyText && ` - "${node.config.bodyText.substring(0, 30)}..."`}
                              </span>
                            )}
                            {node.type === 'WAIT_RESPONSE' && (
                              <span>Timeout: {node.config?.timeout || 60}min</span>
                            )}
                            {node.type === 'DELAY' && (
                              <span>Aguardar {node.config?.delayMinutes || 5} minutos</span>
                            )}
                            {node.type === 'ADD_TAG' && node.config?.tagName && (
                              <span>Tag: {node.config.tagName}</span>
                            )}
                            {node.type === 'AI_RESPONSE' && (
                              <span className="flex items-center"><Sparkles className="h-3 w-3 mr-1" /> ChatGPT</span>
                            )}
                            {node.type === 'AI_CHATBOT' && (
                              <span className="flex items-center"><Sparkles className="h-3 w-3 mr-1" /> Chatbot Contínuo</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Botões para mover nó */}
                        <button
                          onClick={() => handleMoveNodeUp(node.id)}
                          disabled={index === 0}
                          className={`p-1 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-green-600'}`}
                          title="Mover para cima"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveNodeDown(node.id)}
                          disabled={index === nodes.length - 1}
                          className={`p-1 ${index === nodes.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-green-600'}`}
                          title="Mover para baixo"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => setEditingNode(node)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Configuração Expandida */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(node.config, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Seta entre nós */}
                  {index < nodes.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Botão Adicionar Nó */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAddNode(true)}
                className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Adicionar Etapa</span>
              </button>
            </div>

            {/* Fim do Fluxo */}
            {nodes.length > 0 && (
              <>
                <div className="flex justify-center my-2">
                  <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
                </div>
                <div className="bg-gray-100 rounded-lg border border-gray-300 p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Fim do Fluxo</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Painel de Edição */}
        {editingNode && (
          <div className="w-96 bg-white border-l overflow-y-auto">
            <NodeEditor 
              node={editingNode}
              allNodes={nodes}
              onSave={(config) => handleUpdateNode(editingNode.id, config)}
              onClose={() => setEditingNode(null)}
              saving={saving}
              contactFieldOptions={contactFieldOptions}
              availableAgents={availableAgents}
            />
          </div>
        )}
      </div>

      {/* Modal Adicionar Nó */}
      {showAddNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Adicionar Etapa</h3>
              <button onClick={() => setShowAddNode(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {NODE_TYPES.map(nodeType => {
                const Icon = nodeType.icon
                return (
                  <button
                    key={nodeType.type}
                    onClick={() => handleAddNode(nodeType.type)}
                    disabled={saving}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-full ${nodeType.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-sm">{nodeType.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// COMPONENTE: EDITOR DE NÓ
// ==========================================

interface MetaTemplate {
  id: string
  name: string
  status: string
  category: string
  language: string
  bodyText: string
  headerText: string | null
  components: any[]
}

interface NodeEditorProps {
  node: FlowNode
  allNodes: FlowNode[]
  onSave: (config: any) => void
  onClose: () => void
  saving: boolean
  contactFieldOptions: {id: string, name: string, value: string}[]
  availableAgents: {id: string, name: string, email: string, color?: string}[]
}

function NodeEditor({ node, allNodes, onSave, onClose, saving, contactFieldOptions, availableAgents }: NodeEditorProps) {
  const [config, setConfig] = useState(node.config)
  const [nextNodeId, setNextNodeId] = useState(node.nextNodeId || '')
  const [templates, setTemplates] = useState<MetaTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Buscar templates quando o tipo de mensagem for template
  useEffect(() => {
    if (node.type === 'SEND_MESSAGE') {
      fetchTemplates()
    }
  }, [node.type])

  // Preview de arquivo selecionado
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [selectedFile])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/templates`)
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas templates aprovados
        setTemplates(data.filter((t: MetaTemplate) => t.status === 'APPROVED'))
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Upload de arquivo para a API
  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploadingFile(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${apiUrl}/api/wa/upload-media`, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.mediaId
      } else {
        const error = await response.json()
        alert(`Erro no upload: ${error.message || 'Erro desconhecido'}`)
        return null
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload do arquivo')
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  // Handler para seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Limpar URL se tiver arquivo
      setConfig({ ...config, mediaUrl: '' })
    }
  }

  // Detectar tipo de header do template selecionado
  const selectedTemplate = templates.find(t => t.name === config.templateName)
  const headerComponent = selectedTemplate?.components?.find((c: any) => c.type === 'HEADER')
  const headerFormat = headerComponent?.format // TEXT, IMAGE, VIDEO, DOCUMENT

  const handleSave = async () => {
    let finalConfig = { ...config, nextNodeId }
    
    // Se tem arquivo selecionado, fazer upload e salvar mediaId
    if (selectedFile) {
      const mediaId = await handleFileUpload(selectedFile)
      if (mediaId) {
        finalConfig.mediaId = mediaId
        finalConfig.mediaFileName = selectedFile.name
      }
    }
    
    onSave(finalConfig)
  }

  const nodeType = NODE_TYPES.find(n => n.type === node.type)
  const Icon = nodeType?.icon || MessageSquare

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${nodeType?.color || 'bg-gray-500'}`}> 
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold">{node.name}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Seleção do próximo nó (exceto último nó) */}
        {allNodes && allNodes.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Próxima etapa após esta</label>
            <select
              value={nextNodeId}
              onChange={e => setNextNodeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Fim do fluxo</option>
              {allNodes.filter(n => n.id !== node.id).map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Selecione para qual etapa o fluxo deve seguir após esta.</p>
          </div>
        )}
        {/* Configurações específicas por tipo */}
        {node.type === 'SEND_MESSAGE' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Mensagem</label>
              <select
                value={config.messageType || 'text'}
                onChange={(e) => setConfig({ ...config, messageType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="text">Texto</option>
                <option value="template">Template</option>
                <option value="image">Imagem</option>
              </select>
            </div>
            {config.messageType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea
                  value={config.messageContent || ''}
                  onChange={(e) => setConfig({ ...config, messageContent: e.target.value })}
                  rows={4}
                  placeholder="Digite a mensagem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <div className="flex flex-wrap gap-1">
                    <code className="bg-blue-100 px-1 rounded">{'{nome}'}</code>
                    <code className="bg-blue-100 px-1 rounded">{'{telefone}'}</code>
                    <code className="bg-blue-100 px-1 rounded">{'{saudacao}'}</code>
                    <code className="bg-blue-100 px-1 rounded">{'{data}'}</code>
                    <code className="bg-blue-100 px-1 rounded">{'{hora}'}</code>
                  </div>
                  <p className="mt-1 text-gray-500">+ variáveis coletadas no fluxo</p>
                </div>
              </div>
            )}
            {config.messageType === 'image' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">🖼️ Imagem da Mensagem</label>
                
                {/* Upload de imagem */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/jpeg,image/png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="space-y-2">
                        {previewUrl && (
                          <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
                        )}
                        <p className="text-sm text-green-600 font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">Clique para trocar</p>
                      </div>
                    ) : config.mediaFileName ? (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 font-medium">📎 {config.mediaFileName}</p>
                        <p className="text-xs text-gray-500">Arquivo já salvo. Clique para trocar.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-4xl">🖼️</div>
                        <p className="text-sm text-gray-600">Clique para anexar imagem</p>
                        <p className="text-xs text-gray-400">JPG, PNG (máx 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Ou usar URL */}
                <div className="text-center text-xs text-gray-400">— ou use uma URL —</div>
                <input
                  type="text"
                  value={config.mediaUrl || ''}
                  onChange={(e) => {
                    setConfig({ ...config, mediaUrl: e.target.value })
                    setSelectedFile(null)
                  }}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />

                {/* Legenda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legenda (opcional)</label>
                  <textarea
                    value={config.imageCaption || ''}
                    onChange={(e) => setConfig({ ...config, imageCaption: e.target.value })}
                    rows={2}
                    placeholder="Texto que aparecerá abaixo da imagem..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
            {config.messageType === 'template' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Template</label>
                  {loadingTemplates ? (
                    <div className="flex items-center text-gray-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Carregando templates...
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-yellow-600">Nenhum template aprovado encontrado. Crie templates na tela de Templates.</p>
                  ) : (
                    <select
                      value={config.templateName || ''}
                      onChange={(e) => setConfig({ ...config, templateName: e.target.value, templateParams: [] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione um template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Preview do template selecionado */}
                {selectedTemplate && (
                  <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-1">Preview:</p>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedTemplate.bodyText}</p>
                    {selectedTemplate.headerText && (
                      <p className="text-xs text-gray-500 mt-1">Header: {selectedTemplate.headerText}</p>
                    )}
                  </div>
                )}

                {/* Campo de mídia para templates com header de mídia */}
                {headerFormat && headerFormat !== 'TEXT' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {headerFormat === 'IMAGE' && '🖼️ Imagem do Template'}
                      {headerFormat === 'VIDEO' && '🎥 Vídeo do Template'}
                      {headerFormat === 'DOCUMENT' && '📄 Documento do Template'}
                    </label>
                    
                    {/* Upload de arquivo */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                      <input
                        type="file"
                        id="media-upload"
                        accept={
                          headerFormat === 'IMAGE' ? 'image/jpeg,image/png' :
                          headerFormat === 'VIDEO' ? 'video/mp4' :
                          '.pdf'
                        }
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label htmlFor="media-upload" className="cursor-pointer">
                        {selectedFile ? (
                          <div className="space-y-2">
                            {previewUrl && (
                              <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
                            )}
                            <p className="text-sm text-green-600 font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">Clique para trocar</p>
                          </div>
                        ) : config.mediaFileName ? (
                          <div className="space-y-2">
                            <p className="text-sm text-green-600 font-medium">📎 {config.mediaFileName}</p>
                            <p className="text-xs text-gray-500">Arquivo já salvo. Clique para trocar.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-3xl">
                              {headerFormat === 'IMAGE' ? '🖼️' : headerFormat === 'VIDEO' ? '🎥' : '📄'}
                            </div>
                            <p className="text-sm text-gray-600">Clique para anexar arquivo</p>
                            <p className="text-xs text-gray-400">
                              {headerFormat === 'IMAGE' && 'JPG, PNG (máx 5MB)'}
                              {headerFormat === 'VIDEO' && 'MP4 (máx 16MB)'}
                              {headerFormat === 'DOCUMENT' && 'PDF (máx 100MB)'}
                            </p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Ou usar URL */}
                    <div className="text-center text-xs text-gray-400">— ou use uma URL —</div>
                    <input
                      type="text"
                      value={config.mediaUrl || ''}
                      onChange={(e) => {
                        setConfig({ ...config, mediaUrl: e.target.value })
                        setSelectedFile(null) // Limpar arquivo se usar URL
                      }}
                      placeholder={
                        headerFormat === 'IMAGE' ? 'https://exemplo.com/imagem.jpg' :
                        headerFormat === 'VIDEO' ? 'https://exemplo.com/video.mp4' :
                        'https://exemplo.com/documento.pdf'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                {/* Parâmetros do template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parâmetros do Template</label>
                  <div className="space-y-2">
                    {(config.templateParams || []).map((param: any, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={param.key || ''}
                          onChange={e => {
                            const updated = [...(config.templateParams || [])]
                            updated[idx].key = e.target.value
                            setConfig({ ...config, templateParams: updated })
                          }}
                          placeholder="Chave (ex: 1)"
                          className="px-2 py-1 border rounded w-20"
                        />
                        <input
                          type="text"
                          value={param.value || ''}
                          onChange={e => {
                            const updated = [...(config.templateParams || [])]
                            updated[idx].value = e.target.value
                            setConfig({ ...config, templateParams: updated })
                          }}
                          placeholder="Valor ou {variavel}"
                          className="px-2 py-1 border rounded flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(config.templateParams || [])]
                            updated.splice(idx, 1)
                            setConfig({ ...config, templateParams: updated })
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >Remover</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, templateParams: [...(config.templateParams || []), { key: '', value: '' }] })}
                      className="text-xs text-blue-700 hover:text-blue-900"
                    >+ Adicionar parâmetro</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Use variáveis como {'{nome}'} ou {'{telefone}'} nos valores.</p>
                </div>
              </>
            )}
          </>
        )}

        {node.type === 'INTERACTIVE_BUTTONS' && (
          <>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <MousePointerClick className="h-5 w-5 text-indigo-500" />
                <span className="font-medium text-indigo-800">Botões Interativos</span>
              </div>
              <p className="text-sm text-indigo-600 mt-1">
                Envie mensagem com até 3 botões clicáveis. O fluxo seguirá de acordo com o botão escolhido.
              </p>
            </div>
            
            {/* Texto principal (obrigatório) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto da Mensagem *</label>
              <textarea
                value={config.bodyText || ''}
                onChange={(e) => setConfig({ ...config, bodyText: e.target.value })}
                rows={3}
                placeholder="Ex: Olá! Como posso ajudar você hoje?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Texto principal exibido acima dos botões</p>
            </div>
            
            {/* Rodapé (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rodapé (opcional)</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                placeholder="Ex: Responda clicando em uma opção"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            {/* Botões */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Botões (máximo 3)
              </label>
              <div className="space-y-3">
                {(config.buttons || []).map((btn: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Botão {idx + 1}</span>
                      {config.buttons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.buttons]
                            updated.splice(idx, 1)
                            setConfig({ ...config, buttons: updated })
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={btn.title || ''}
                      onChange={(e) => {
                        const updated = [...config.buttons]
                        updated[idx] = { 
                          ...updated[idx], 
                          title: e.target.value.substring(0, 20),
                          id: `btn_${idx + 1}_${e.target.value.toLowerCase().replace(/\s/g, '_').substring(0, 10)}`
                        }
                        setConfig({ ...config, buttons: updated })
                      }}
                      placeholder="Texto do botão (máx 20 chars)"
                      maxLength={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                    />
                    <select
                      value={btn.nextNodeId || ''}
                      onChange={(e) => {
                        const updated = [...config.buttons]
                        updated[idx] = { ...updated[idx], nextNodeId: e.target.value || null }
                        setConfig({ ...config, buttons: updated })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Fim do fluxo (quando clicado)</option>
                      {allNodes?.filter(n => n.id !== node.id).map(n => (
                        <option key={n.id} value={n.id}>Ir para: {n.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
                
                {(config.buttons || []).length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newIndex = (config.buttons || []).length + 1
                      setConfig({ 
                        ...config, 
                        buttons: [
                          ...(config.buttons || []), 
                          { id: `btn_${newIndex}`, title: '', nextNodeId: null }
                        ] 
                      })
                    }}
                    className="w-full py-2 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors text-sm"
                  >
                    + Adicionar Botão
                  </button>
                )}
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-gray-800">{config.bodyText || 'Texto da mensagem...'}</p>
                {config.footerText && (
                  <p className="text-xs text-gray-500 mt-1">{config.footerText}</p>
                )}
                <div className="mt-2 space-y-1">
                  {(config.buttons || []).map((btn: any, idx: number) => (
                    <div key={idx} className="bg-white border rounded-lg py-2 px-3 text-center text-sm text-blue-600 font-medium">
                      {btn.title || `Botão ${idx + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* LISTA INTERATIVA */}
        {node.type === 'INTERACTIVE_LIST' && (
          <>
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <List className="h-5 w-5 text-cyan-500" />
                <span className="font-medium text-cyan-800">Lista Interativa</span>
              </div>
              <p className="text-sm text-cyan-600 mt-1">
                Envie um menu com lista de opções. Ideal para quando precisa de mais de 3 opções.
              </p>
            </div>
            
            {/* Texto principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto da Mensagem *</label>
              <textarea
                value={config.bodyText || ''}
                onChange={(e) => setConfig({ ...config, bodyText: e.target.value })}
                rows={3}
                placeholder="Ex: Escolha uma das opções abaixo:"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            {/* Rodapé */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rodapé (opcional)</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                placeholder="Ex: Toque para ver as opções"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            {/* Texto do botão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Botão de Menu</label>
              <input
                type="text"
                value={config.listButtonText || 'Ver opções'}
                onChange={(e) => setConfig({ ...config, listButtonText: e.target.value })}
                placeholder="Ver opções"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            {/* Seções e itens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seções e Itens</label>
              <div className="space-y-4">
                {(config.listSections || []).map((section: any, sIdx: number) => (
                  <div key={sIdx} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => {
                          const updated = [...config.listSections]
                          updated[sIdx] = { ...updated[sIdx], title: e.target.value }
                          setConfig({ ...config, listSections: updated })
                        }}
                        placeholder="Título da seção"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                      />
                      {config.listSections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.listSections]
                            updated.splice(sIdx, 1)
                            setConfig({ ...config, listSections: updated })
                          }}
                          className="ml-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Remover seção
                        </button>
                      )}
                    </div>
                    
                    {/* Itens da seção */}
                    <div className="space-y-2 mt-2">
                      {(section.rows || []).map((row: any, rIdx: number) => (
                        <div key={rIdx} className="bg-white border rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Item {rIdx + 1}</span>
                            {section.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...config.listSections]
                                  updated[sIdx].rows.splice(rIdx, 1)
                                  setConfig({ ...config, listSections: updated })
                                }}
                                className="text-xs text-red-500"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={row.title || ''}
                            onChange={(e) => {
                              const updated = [...config.listSections]
                              updated[sIdx].rows[rIdx] = { 
                                ...updated[sIdx].rows[rIdx], 
                                title: e.target.value.substring(0, 24),
                                id: `row_${sIdx}_${rIdx}_${e.target.value.toLowerCase().replace(/\s/g, '_').substring(0, 10)}`
                              }
                              setConfig({ ...config, listSections: updated })
                            }}
                            placeholder="Título (máx 24)"
                            maxLength={24}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-1"
                          />
                          <input
                            type="text"
                            value={row.description || ''}
                            onChange={(e) => {
                              const updated = [...config.listSections]
                              updated[sIdx].rows[rIdx] = { 
                                ...updated[sIdx].rows[rIdx], 
                                description: e.target.value.substring(0, 72)
                              }
                              setConfig({ ...config, listSections: updated })
                            }}
                            placeholder="Descrição (opcional, máx 72)"
                            maxLength={72}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-1"
                          />
                          <select
                            value={row.nextNodeId || ''}
                            onChange={(e) => {
                              const updated = [...config.listSections]
                              updated[sIdx].rows[rIdx] = { 
                                ...updated[sIdx].rows[rIdx], 
                                nextNodeId: e.target.value || null
                              }
                              setConfig({ ...config, listSections: updated })
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Fim do fluxo</option>
                            {allNodes?.filter(n => n.id !== node.id).map(n => (
                              <option key={n.id} value={n.id}>Ir para: {n.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...config.listSections]
                          const newRowIdx = updated[sIdx].rows.length
                          updated[sIdx].rows.push({ id: `row_${sIdx}_${newRowIdx}`, title: '', description: '', nextNodeId: null })
                          setConfig({ ...config, listSections: updated })
                        }}
                        className="w-full py-1 border border-dashed border-gray-300 rounded text-gray-500 text-sm hover:bg-gray-50"
                      >
                        + Adicionar item
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const newSectionIdx = (config.listSections || []).length
                    setConfig({ 
                      ...config, 
                      listSections: [
                        ...(config.listSections || []),
                        { title: `Seção ${newSectionIdx + 1}`, rows: [{ id: `row_${newSectionIdx}_0`, title: '', description: '', nextNodeId: null }] }
                      ]
                    })
                  }}
                  className="w-full py-2 border-2 border-dashed border-cyan-300 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors text-sm"
                >
                  + Adicionar Seção
                </button>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-gray-800">{config.bodyText || 'Texto da mensagem...'}</p>
                {config.footerText && (
                  <p className="text-xs text-gray-500 mt-1">{config.footerText}</p>
                )}
                <div className="mt-2">
                  <div className="bg-white border rounded-lg py-2 px-3 text-center text-sm text-blue-600 font-medium flex items-center justify-center space-x-1">
                    <List className="h-4 w-4" />
                    <span>{config.listButtonText || 'Ver opções'}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* GOOGLE SHEETS */}
        {node.type === 'GOOGLE_SHEETS' && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Sheet className="h-5 w-5 text-emerald-500" />
                <span className="font-medium text-emerald-800">Google Sheets</span>
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                Envie dados do contato para uma planilha do Google automaticamente.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID da Planilha *</label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
                placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Encontre na URL: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Aba</label>
              <input
                type="text"
                value={config.sheetName || 'Sheet1'}
                onChange={(e) => setConfig({ ...config, sheetName: e.target.value })}
                placeholder="Sheet1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campos a Enviar</label>
              <div className="space-y-2">
                {(config.fields || []).map((field: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={field.column || ''}
                      onChange={(e) => {
                        const updated = [...config.fields]
                        updated[idx] = { ...updated[idx], column: e.target.value.toUpperCase() }
                        setConfig({ ...config, fields: updated })
                      }}
                      placeholder="Coluna (A, B, C...)"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                    />
                    <select
                      value={field.field || ''}
                      onChange={(e) => {
                        const updated = [...config.fields]
                        const selected = contactFieldOptions.find(f => f.value === e.target.value)
                        updated[idx] = { ...updated[idx], field: e.target.value, label: selected?.name || e.target.value }
                        setConfig({ ...config, fields: updated })
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Selecione um campo</option>
                      <optgroup label="Campos do Contato">
                        <option value="nome">Nome</option>
                        <option value="telefone">Telefone</option>
                        <option value="email">Email</option>
                        <option value="empresa">Empresa</option>
                        <option value="cidade">Cidade</option>
                        <option value="estado">Estado</option>
                        <option value="origem">Origem</option>
                        <option value="interesse">Interesse</option>
                        <option value="tags">Tags</option>
                        <option value="data_contato">Data do Contato</option>
                      </optgroup>
                      <optgroup label="Campos Personalizados">
                        {contactFieldOptions.map(opt => (
                          <option key={opt.id} value={opt.value}>{opt.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    {config.fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...config.fields]
                          updated.splice(idx, 1)
                          setConfig({ ...config, fields: updated })
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setConfig({ 
                      ...config, 
                      fields: [...(config.fields || []), { column: '', field: '', label: '' }]
                    })
                  }}
                  className="w-full py-2 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors text-sm"
                >
                  + Adicionar Campo
                </button>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-yellow-800 mb-1">⚙️ Configuração necessária:</p>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                <li>Configure GOOGLE_SERVICE_ACCOUNT_EMAIL no Render</li>
                <li>Configure GOOGLE_PRIVATE_KEY no Render</li>
                <li>Compartilhe a planilha com o email da conta de serviço</li>
              </ol>
            </div>
          </>
        )}

        {/* ASSIGN AGENT - Atribuir conversa a atendente */}
        {node.type === 'ASSIGN_AGENT' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-amber-800">Atribuir Atendente</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                Atribua esta conversa a um atendente específico automaticamente.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Atendente *</label>
              <select
                value={config.agentId || ''}
                onChange={(e) => setConfig({ ...config, agentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecione um atendente...</option>
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
              {availableAgents.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Nenhum atendente cadastrado. Cadastre usuários em Configurações → Usuários.
                </p>
              )}
            </div>
            
            {config.agentId && (
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: availableAgents.find(a => a.id === config.agentId)?.color || '#F59E0B' }}
                >
                  {availableAgents.find(a => a.id === config.agentId)?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {availableAgents.find(a => a.id === config.agentId)?.name || 'Atendente'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {availableAgents.find(a => a.id === config.agentId)?.email || ''}
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyAgent"
                  checked={config.notifyAgent || false}
                  onChange={(e) => setConfig({ ...config, notifyAgent: e.target.checked })}
                  className="h-4 w-4 text-amber-600 rounded border-gray-300"
                />
                <label htmlFor="notifyAgent" className="text-sm text-gray-700">
                  Enviar notificação interna ao atendente
                </label>
              </div>
              
              {config.notifyAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem para o atendente</label>
                  <textarea
                    value={config.notifyMessage || ''}
                    onChange={(e) => setConfig({ ...config, notifyMessage: e.target.value })}
                    rows={3}
                    placeholder="Ex: Nova conversa atribuída via automação. Cliente interessado em..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    <p className="font-medium mb-1">Variáveis disponíveis:</p>
                    <div className="flex flex-wrap gap-1">
                      <code className="bg-amber-100 px-1 rounded">{'{nome}'}</code>
                      <code className="bg-amber-100 px-1 rounded">{'{telefone}'}</code>
                      <code className="bg-amber-100 px-1 rounded">{'{interesse}'}</code>
                      <code className="bg-amber-100 px-1 rounded">{'{origem}'}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-800 mb-1">💡 Dica:</p>
              <p className="text-blue-700">
                Use este nó após coletar informações do cliente para direcionar a conversa 
                ao atendente mais adequado. Você pode criar múltiplos fluxos para diferentes 
                departamentos (vendas, suporte, etc).
              </p>
            </div>
          </>
        )}

        {/* HTTP REQUEST - Requisição externa */}
        {node.type === 'HTTP_REQUEST' && (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-slate-500" />
                <span className="font-medium text-slate-800">Requisição HTTP</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Envie dados para uma API externa ou webhook.
              </p>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <select
                  value={config.httpMethod || 'POST'}
                  onChange={(e) => setConfig({ ...config, httpMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={config.httpUrl || ''}
                  onChange={(e) => setConfig({ ...config, httpUrl: e.target.value })}
                  placeholder="https://api.exemplo.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            {config.httpMethod !== 'GET' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Corpo da Requisição (JSON)</label>
                <textarea
                  value={config.httpBody || ''}
                  onChange={(e) => setConfig({ ...config, httpBody: e.target.value })}
                  rows={6}
                  placeholder='{"telefone": "{telefone}", "nome": "{nome}"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <div className="flex flex-wrap gap-1">
                    <code className="bg-slate-100 px-1 rounded">{'{nome}'}</code>
                    <code className="bg-slate-100 px-1 rounded">{'{telefone}'}</code>
                    <code className="bg-slate-100 px-1 rounded">{'{email}'}</code>
                    <code className="bg-slate-100 px-1 rounded">{'{empresa}'}</code>
                    <code className="bg-slate-100 px-1 rounded">{'{interesse}'}</code>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salvar resposta como (opcional)</label>
              <input
                type="text"
                value={config.saveResponseAs || ''}
                onChange={(e) => setConfig({ ...config, saveResponseAs: e.target.value })}
                placeholder="resposta_api"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                O corpo da resposta será salvo em customFields do contato
              </p>
            </div>
          </>
        )}

        {/* UPDATE CONTACT - Atualizar dados do contato */}
        {node.type === 'UPDATE_CONTACT' && (
          <>
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-lime-600" />
                <span className="font-medium text-lime-800">Atualizar Contato</span>
              </div>
              <p className="text-sm text-lime-600 mt-1">
                Atualize campos do contato automaticamente durante o fluxo.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campos a Atualizar</label>
              <div className="space-y-2">
                {(config.updateFields || []).map((uf: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <select
                      value={uf.field || ''}
                      onChange={(e) => {
                        const updated = [...(config.updateFields || [])]
                        updated[idx] = { ...updated[idx], field: e.target.value }
                        setConfig({ ...config, updateFields: updated })
                      }}
                      className="w-40 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Campo...</option>
                      <option value="name">Nome</option>
                      <option value="email">Email</option>
                      <option value="company">Empresa</option>
                      <option value="city">Cidade</option>
                      <option value="state">Estado</option>
                      <option value="source">Origem</option>
                      <option value="interest">Interesse</option>
                      <option value="customerStatus">Status</option>
                      <option value="notes">Observações</option>
                    </select>
                    <input
                      type="text"
                      value={uf.value || ''}
                      onChange={(e) => {
                        const updated = [...(config.updateFields || [])]
                        updated[idx] = { ...updated[idx], value: e.target.value }
                        setConfig({ ...config, updateFields: updated })
                      }}
                      placeholder="Novo valor ou {variável}"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    {(config.updateFields || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(config.updateFields || [])]
                          updated.splice(idx, 1)
                          setConfig({ ...config, updateFields: updated })
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setConfig({ 
                      ...config, 
                      updateFields: [...(config.updateFields || []), { field: '', value: '' }]
                    })
                  }}
                  className="w-full py-2 border-2 border-dashed border-lime-300 rounded-lg text-lime-600 hover:bg-lime-50 transition-colors text-sm"
                >
                  + Adicionar Campo
                </button>
              </div>
              
              <div className="mt-2 p-2 bg-lime-50 border border-lime-200 rounded text-xs text-lime-700">
                <p className="font-medium mb-1">Variáveis disponíveis:</p>
                <div className="flex flex-wrap gap-1">
                  <code className="bg-lime-100 px-1 rounded">{'{resposta}'}</code>
                  <code className="bg-lime-100 px-1 rounded">{'{data_atual}'}</code>
                  <code className="bg-lime-100 px-1 rounded">{'{nome_fluxo}'}</code>
                </div>
              </div>
            </div>
          </>
        )}

        {node.type === 'WAIT_RESPONSE' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (minutos)</label>
              <input
                type="number"
                value={config.timeout || 60}
                onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salvar resposta como</label>
              {contactFieldOptions.length > 0 ? (
                <select
                  value={config.saveAs || ''}
                  onChange={(e) => setConfig({ ...config, saveAs: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione um campo...</option>
                  {contactFieldOptions.map((field) => (
                    <option key={field.id} value={field.value}>
                      {field.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.saveAs || ''}
                  onChange={(e) => setConfig({ ...config, saveAs: e.target.value })}
                  placeholder="resposta_cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {contactFieldOptions.length > 0 
                  ? 'Campos cadastrados em Configurações → Campos de Coleta' 
                  : 'Cadastre campos em Configurações → Campos de Coleta para aparecerem aqui'}
              </p>
            </div>
          </>
        )}

        {node.type === 'DELAY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aguardar (minutos)</label>
            <input
              type="number"
              value={config.delayMinutes || 5}
              onChange={(e) => setConfig({ ...config, delayMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {node.type === 'ADD_TAG' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Tag</label>
            <input
              type="text"
              value={config.tagName || ''}
              onChange={(e) => setConfig({ ...config, tagName: e.target.value })}
              placeholder="interessado_yoga"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {node.type === 'AI_RESPONSE' && (
          <>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                <span className="font-medium text-pink-800">Resposta com ChatGPT</span>
              </div>
              <p className="text-sm text-pink-600 mt-1">
                Configure a IA para responder automaticamente
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Prompt do Sistema</label>
                <button
                  type="button"
                  onClick={() => setConfig({ 
                    ...config, 
                    aiPrompt: `Você é a assistente virtual do Sol Instituto Terapêutico, especializado em Yoga, Meditação e Terapias Holísticas.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja calorosa, acolhedora e profissional
- Respostas CURTAS (máximo 3 linhas)
- Pergunte UMA COISA de cada vez
- NÃO invente preços ou horários - diga que a equipe vai informar
- Se não souber, diga: "Vou verificar com nossa equipe e te retorno!"
- Sempre finalize convidando para uma aula experimental

INFORMAÇÕES QUE VOCÊ SABE:
- Funcionamento: Segunda a Sábado
- Modalidades: Yoga, Meditação, Massoterapia, Reiki

INFORMAÇÕES QUE VOCÊ NÃO SABE (encaminhar para equipe):
- Preços e pacotes
- Horários específicos das aulas` 
                  })}
                  className="text-xs text-pink-600 hover:text-pink-800"
                >
                  Usar modelo sugerido
                </button>
              </div>
              <textarea
                value={config.aiPrompt || ''}
                onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                rows={6}
                placeholder="Você é um assistente da Sol Instituto Terapêutico. Responda de forma amigável..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <select
                value={config.aiModel || 'gpt-3.5-turbo'}
                onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido e econômico)</option>
                <option value="gpt-4">GPT-4 (Avançado)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Mais recente)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                GPT-3.5 é recomendado para respostas rápidas e menor custo
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de Tokens</label>
              <input
                type="number"
                value={config.aiMaxTokens || 300}
                onChange={(e) => setConfig({ ...config, aiMaxTokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                300 tokens ≈ 200 palavras. Limite recomendado para respostas curtas.
              </p>
            </div>
            
            {/* Novas opções avançadas */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">⚙️ Opções Avançadas</p>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.useHistory !== false}
                    onChange={(e) => setConfig({ ...config, useHistory: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600"
                  />
                  <span className="text-sm text-gray-700">Usar histórico da conversa</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">A IA terá acesso às últimas mensagens para manter contexto</p>
                
                {config.useHistory !== false && (
                  <div className="ml-6">
                    <label className="block text-xs text-gray-600 mb-1">Mensagens de histórico</label>
                    <input
                      type="number"
                      value={config.historyLimit || 10}
                      onChange={(e) => setConfig({ ...config, historyLimit: parseInt(e.target.value) })}
                      min={1}
                      max={20}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.useKnowledge !== false}
                    onChange={(e) => setConfig({ ...config, useKnowledge: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600"
                  />
                  <span className="text-sm text-gray-700">Usar base de conhecimento</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">A IA consultará a base de conhecimento para respostas mais precisas</p>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Atendente para transferência (opcional)</label>
                  <select
                    value={config.handoffAgentId || ''}
                    onChange={(e) => setConfig({ ...config, handoffAgentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Não transferir automaticamente</option>
                    {availableAgents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Se o cliente pedir para falar com humano, transfere para este atendente</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Editor AI_CHATBOT */}
        {node.type === 'AI_CHATBOT' && (
          <>
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <span className="font-medium text-violet-800">Chatbot IA Contínuo</span>
              </div>
              <p className="text-sm text-violet-600 mt-1">
                A IA mantém uma conversa natural até o cliente pedir para falar com humano
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Personalidade do Chatbot</label>
                <button
                  type="button"
                  onClick={() => setConfig({ 
                    ...config, 
                    aiPrompt: `Você é a assistente virtual do Sol Instituto Terapêutico, especializado em Yoga, Meditação e Terapias Holísticas.

PERSONALIDADE:
- Calorosa, acolhedora e profissional
- Respostas curtas e objetivas (2-3 linhas)
- Sempre em português do Brasil

REGRAS:
- Pergunte UMA coisa de cada vez
- NÃO invente preços ou horários
- Se não souber, diga: "Vou verificar com nossa equipe!"
- Convide para aula experimental quando apropriado

QUANDO TRANSFERIR:
- Se o cliente pedir para falar com humano/atendente
- Se o assunto for muito complexo
- Se o cliente demonstrar frustração`
                  })}
                  className="text-xs text-violet-600 hover:text-violet-800"
                >
                  Usar modelo sugerido
                </button>
              </div>
              <textarea
                value={config.aiPrompt || ''}
                onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                rows={8}
                placeholder="Defina a personalidade e regras do chatbot..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <select
                  value={config.aiModel || 'gpt-3.5-turbo'}
                  onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Histórico (mensagens)</label>
                <input
                  type="number"
                  value={config.historyLimit || 15}
                  onChange={(e) => setConfig({ ...config, historyLimit: parseInt(e.target.value) })}
                  min={5}
                  max={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.useKnowledge !== false}
                onChange={(e) => setConfig({ ...config, useKnowledge: e.target.checked })}
                className="rounded border-gray-300 text-violet-600"
              />
              <span className="text-sm text-gray-700">Usar base de conhecimento</span>
            </label>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">🔀 Transferência para Humano</p>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Atendente padrão para transferência</label>
                <select
                  value={config.handoffAgentId || ''}
                  onChange={(e) => setConfig({ ...config, handoffAgentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Selecione um atendente</option>
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Quando o cliente pedir humano, a conversa será atribuída a este atendente
                </p>
              </div>
            </div>
          </>
        )}

        {node.type === 'NOTIFY' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Mensagem de Notificação</label>
              <button
                type="button"
                onClick={() => setConfig({ 
                  ...config, 
                  notifyMessage: `🔔 NOVO LEAD VIA AUTOMAÇÃO

👤 Nome: {nome}
📱 Telefone: {telefone}
📅 Data: {data_hora}

⚡ Ação: Entrar em contato para agendar` 
                })}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Usar modelo
              </button>
            </div>
            <textarea
              value={config.notifyMessage || ''}
              onChange={(e) => setConfig({ ...config, notifyMessage: e.target.value })}
              rows={5}
              placeholder="Novo lead interessado em..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <p className="font-medium mb-1">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-1">
                <code className="bg-red-100 px-1 rounded">{'{nome}'}</code>
                <code className="bg-red-100 px-1 rounded">{'{telefone}'}</code>
                <code className="bg-red-100 px-1 rounded">{'{data_hora}'}</code>
              </div>
            </div>
          </div>
        )}

        {node.type === 'COLLECT_DATA' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta</label>
              <input
                type="text"
                value={config.fieldName || ''}
                onChange={(e) => setConfig({ ...config, fieldName: e.target.value })}
                placeholder="Qual seu nome?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salvar como</label>
              {contactFieldOptions.length > 0 ? (
                <select
                  value={config.saveAs || ''}
                  onChange={(e) => setConfig({ ...config, saveAs: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione um campo...</option>
                  {contactFieldOptions.map((field) => (
                    <option key={field.id} value={field.value}>
                      {field.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.saveAs || ''}
                  onChange={(e) => setConfig({ ...config, saveAs: e.target.value })}
                  placeholder="nome_cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {contactFieldOptions.length > 0 
                  ? 'Campos cadastrados em Configurações → Campos de Coleta' 
                  : 'Cadastre campos em Configurações → Campos de Coleta para aparecerem aqui'}
              </p>
            </div>
          </>
        )}

        {node.type === 'CONDITION' && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-purple-800">Condição Avançada</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">
                Avalia a última resposta do cliente e direciona para diferentes etapas do fluxo.
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Se a resposta do cliente...</p>
              
              {(config.conditions || []).map((cond: any, idx: number) => (
                <div key={idx} className="border border-purple-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-purple-600 font-medium">Condição {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(config.conditions || [])]
                        updated.splice(idx, 1)
                        setConfig({ ...config, conditions: updated })
                      }}
                      className="ml-auto text-xs text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                      value={cond.type || 'contains'}
                      onChange={e => {
                        const updated = [...(config.conditions || [])]
                        updated[idx].type = e.target.value
                        setConfig({ ...config, conditions: updated })
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="contains">Contém</option>
                      <option value="equals">É exatamente igual a</option>
                      <option value="regex">Corresponde ao padrão (Regex)</option>
                      <option value="button_id">ID do botão clicado</option>
                    </select>
                    <input
                      type="text"
                      value={cond.value || ''}
                      onChange={e => {
                        const updated = [...(config.conditions || [])]
                        updated[idx].value = e.target.value
                        setConfig({ ...config, conditions: updated })
                      }}
                      placeholder={cond.type === 'regex' ? 'Ex: ^sim$' : 'Ex: sim, quero'}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Então ir para:</span>
                    <select
                      value={cond.nextNodeId || ''}
                      onChange={e => {
                        const updated = [...(config.conditions || [])]
                        updated[idx].nextNodeId = e.target.value
                        setConfig({ ...config, conditions: updated })
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Fim do fluxo</option>
                      {allNodes.filter(n => n.id !== node.id).map(n => (
                        <option key={n.id} value={n.id}>→ {n.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => setConfig({ 
                  ...config, 
                  conditions: [...(config.conditions || []), { type: 'contains', value: '', nextNodeId: '' }] 
                })}
                className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors text-sm"
              >
                + Adicionar Condição
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Se nenhuma condição for satisfeita, ir para:
              </label>
              <select
                value={config.defaultNextNodeId || ''}
                onChange={e => setConfig({ ...config, defaultNextNodeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Fim do fluxo</option>
                {allNodes.filter(n => n.id !== node.id).map(n => (
                  <option key={n.id} value={n.id}>→ {n.name}</option>
                ))}
              </select>
            </div>
            
            {/* Visualização do fluxo */}
            {(config.conditions || []).length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">📊 Resumo do Roteamento:</p>
                <div className="space-y-1 text-xs">
                  {(config.conditions || []).map((cond: any, idx: number) => {
                    const targetNode = allNodes.find(n => n.id === cond.nextNodeId)
                    return (
                      <div key={idx} className="flex items-center text-gray-600">
                        <span className="text-purple-600">•</span>
                        <span className="ml-1">
                          {cond.type === 'contains' && 'Contém'}
                          {cond.type === 'equals' && 'Igual a'}
                          {cond.type === 'regex' && 'Regex'}
                          {cond.type === 'button_id' && 'Botão'}
                          {' "'}{cond.value || '...'}{'" → '}
                          <span className="font-medium text-purple-700">
                            {targetNode ? targetNode.name : 'Fim'}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex items-center text-gray-500">
                    <span className="text-gray-400">•</span>
                    <span className="ml-1">
                      Senão → <span className="font-medium">
                        {allNodes.find(n => n.id === config.defaultNextNodeId)?.name || 'Fim'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t flex space-x-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </button>
      </div>
    </div>
  )
}