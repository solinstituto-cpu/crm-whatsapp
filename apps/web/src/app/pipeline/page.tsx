'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  TrendingUp,
  Plus,
  DollarSign,
  Calendar,
  User,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Target,
  Percent,
  CheckCircle,
  Clock,
  TrendingDown,
  Search,
  Filter,
  ChevronDown,
  Settings,
  ChevronUp,
  Palette
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  phoneE164: string
  email?: string
}

interface Stage {
  id: string
  name: string
  color: string
  order: number
}

interface Deal {
  id: string
  title: string
  description?: string
  amount: number
  probability?: number
  expectedCloseDate?: string
  source?: string
  lostReason?: string
  wonAt?: string
  lostAt?: string
  createdAt: string
  contact: Contact
  stage: Stage
  owner?: { id: string; name: string }
}

interface StageWithDeals extends Stage {
  deals: Deal[]
  totalValue: number
  dealCount: number
}

export default function PipelinePage() {
  const { data: session, status } = useSession()
  const [stages, setStages] = useState<StageWithDeals[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalValue: 0,
    totalDeals: 0,
    conversionRate: 0,
    wonValue: 0,
    pendingValue: 0,
    expectedValue: 0,
    wonDeals: 0,
    pendingDeals: 0
  })

  // Modal states
  const [showDealModal, setShowDealModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [showDealMenu, setShowDealMenu] = useState<string | null>(null)

  // Form state
  const [dealForm, setDealForm] = useState({
    title: '',
    contactId: '',
    stageId: '',
    amount: 0,
    description: '',
    probability: 50,
    expectedCloseDate: '',
    source: ''
  })

  // Drag state
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    minAmount: '',
    maxAmount: '',
    minProbability: ''
  })

  // Stage management state
  const [showStageModal, setShowStageModal] = useState(false)
  const [editingStage, setEditingStage] = useState<StageWithDeals | null>(null)
  const [stageForm, setStageForm] = useState({
    name: '',
    color: '#6B7280'
  })

  // Filtered stages based on filter criteria
  const filteredStages = stages.map(stage => ({
    ...stage,
    deals: stage.deals.filter(deal => {
      // Search filter (title or contact name)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const titleMatch = deal.title.toLowerCase().includes(searchLower)
        const contactMatch = deal.contact?.name?.toLowerCase().includes(searchLower) || false
        if (!titleMatch && !contactMatch) return false
      }
      
      // Source filter
      if (filters.source && deal.source !== filters.source) return false
      
      // Min amount filter
      if (filters.minAmount && deal.amount < Number(filters.minAmount)) return false
      
      // Max amount filter
      if (filters.maxAmount && deal.amount > Number(filters.maxAmount)) return false
      
      // Min probability filter
      if (filters.minProbability && (deal.probability || 0) < Number(filters.minProbability)) return false
      
      return true
    })
  }))

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.source,
    filters.minAmount,
    filters.maxAmount,
    filters.minProbability
  ].filter(Boolean).length

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    fetchPipeline()
    fetchContacts()
  }, [])

  const fetchPipeline = async () => {
    try {
      setLoading(true)
      const apiUrl = getApiUrl()
      
      const [stagesRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/pipeline/stages`),
        fetch(`${apiUrl}/api/pipeline/stats`)
      ])

      if (stagesRes.ok) {
        const stagesData = await stagesRes.json()
        setStages(stagesData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalValue: statsData.totalValue || 0,
          totalDeals: statsData.totalDeals || 0,
          conversionRate: statsData.conversionRate || 0,
          wonValue: statsData.wonValue || 0,
          pendingValue: statsData.pendingValue || 0,
          expectedValue: statsData.expectedValue || 0,
          wonDeals: statsData.wonDeals || 0,
          pendingDeals: statsData.pendingDeals || 0
        })
      }
    } catch (error) {
      console.error('Erro ao buscar pipeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/contacts?limit=100`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error)
    }
  }

  const handleOpenDealModal = (stageId?: string, deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal)
      setDealForm({
        title: deal.title,
        contactId: deal.contact.id,
        stageId: deal.stage.id,
        amount: deal.amount,
        description: deal.description || '',
        probability: deal.probability || 50,
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
        source: deal.source || ''
      })
    } else {
      setEditingDeal(null)
      setDealForm({
        title: '',
        contactId: '',
        stageId: stageId || stages[0]?.id || '',
        amount: 0,
        description: '',
        probability: 50,
        expectedCloseDate: '',
        source: ''
      })
    }
    setShowDealModal(true)
  }

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const apiUrl = getApiUrl()
      const url = editingDeal 
        ? `${apiUrl}/api/pipeline/deals/${editingDeal.id}`
        : `${apiUrl}/api/pipeline/deals`
      
      const res = await fetch(url, {
        method: editingDeal ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dealForm,
          amount: Number(dealForm.amount),
          probability: Number(dealForm.probability)
        })
      })

      if (res.ok) {
        setShowDealModal(false)
        fetchPipeline()
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao salvar deal')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao salvar deal')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Tem certeza que deseja excluir este deal?')) return
    
    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/pipeline/deals/${dealId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchPipeline()
      }
    } catch (error) {
      console.error('Erro:', error)
    }
    setShowDealMenu(null)
  }

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/pipeline/deals/${dealId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: newStageId })
      })

      if (res.ok) {
        fetchPipeline()
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  // ==================== STAGE MANAGEMENT ====================
  
  const handleOpenStageModal = (stage?: StageWithDeals) => {
    if (stage) {
      setEditingStage(stage)
      setStageForm({
        name: stage.name,
        color: stage.color
      })
    } else {
      setEditingStage(null)
      setStageForm({
        name: '',
        color: '#6B7280'
      })
    }
    setShowStageModal(true)
  }

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const apiUrl = getApiUrl()
      const url = editingStage 
        ? `${apiUrl}/api/pipeline/stages/${editingStage.id}`
        : `${apiUrl}/api/pipeline/stages`
      
      const res = await fetch(url, {
        method: editingStage ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageForm)
      })

      if (res.ok) {
        setShowStageModal(false)
        fetchPipeline()
      }
    } catch (error) {
      console.error('Erro ao salvar etapa:', error)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etapa? Todos os negócios serão perdidos.')) {
      return
    }

    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/pipeline/stages/${stageId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchPipeline()
      }
    } catch (error) {
      console.error('Erro ao deletar etapa:', error)
    }
  }

  const handleReorderStage = async (stageId: string, direction: 'up' | 'down') => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return
    
    const newOrder = direction === 'up' ? stage.order - 1 : stage.order + 1
    
    // Check bounds
    if (newOrder < 1 || newOrder > stages.length) return
    
    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/pipeline/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      })

      if (res.ok) {
        fetchPipeline()
      }
    } catch (error) {
      console.error('Erro ao reordenar etapa:', error)
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDeal(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (draggedDeal) {
      handleMoveDeal(draggedDeal, stageId)
      setDraggedDeal(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-7 w-7 mr-2 text-green-600" />
              Pipeline de Vendas
            </h1>
            <p className="text-gray-600 mt-1">Gerencie suas oportunidades de negócio</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center border ${
                showFilters || Object.values(filters).some(v => v !== '') 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {Object.values(filters).filter(v => v !== '').length > 0 && (
                <span className="ml-2 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => handleOpenStageModal()}
              className="px-4 py-2 rounded-lg flex items-center border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Etapas
            </button>
            <button 
              onClick={() => handleOpenDealModal()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Deal
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Título ou contato..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Site">Site</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor Mínimo</label>
                <input
                  type="number"
                  placeholder="R$ 0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor Máximo</label>
                <input
                  type="number"
                  placeholder="Sem limite"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prob. Mínima</label>
                <select
                  value={filters.minProbability}
                  onChange={(e) => setFilters({ ...filters, minProbability: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="25">≥ 25%</option>
                  <option value="50">≥ 50%</option>
                  <option value="75">≥ 75%</option>
                  <option value="90">≥ 90%</option>
                </select>
              </div>
            </div>
            {Object.values(filters).some(v => v !== '') && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setFilters({ search: '', source: '', minAmount: '', maxAmount: '', minProbability: '' })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Pipeline</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalDeals} deals</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Vendido</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.wonValue)}</p>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.wonDeals} fechados</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Em Aberto</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.pendingValue)}</p>
              </div>
              <div className="p-2 rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.pendingDeals} pendentes</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Previsão</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.expectedValue)}</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">ponderado por %</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Conversão</p>
                <p className="text-xl font-bold text-indigo-600">{stats.conversionRate}%</p>
              </div>
              <div className="p-2 rounded-full bg-indigo-100">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">taxa de fechamento</p>
          </div>
        </div>

        {/* Pipeline Kanban */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pipeline Kanban</h2>
            {activeFilterCount > 0 && (
              <span className="text-sm text-gray-500">
                Mostrando {filteredStages.reduce((acc, s) => acc + s.deals.length, 0)} de {stages.reduce((acc, s) => acc + s.deals.length, 0)} negócios
              </span>
            )}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
            {filteredStages.map((stage) => (
              <div
                key={stage.id}
                className="flex-shrink-0 w-72 bg-gray-50 rounded-lg flex flex-col"
                style={{ minHeight: '350px', maxHeight: '60vh' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div className="p-3 border-b bg-white rounded-t-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: stage.color }}></div>
                      <span className="font-medium">{stage.name}</span>
                      <span className="ml-2 text-sm text-gray-500">({stage.dealCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenDealModal(stage.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Adicionar negócio"
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Stage Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t">
                    <button
                      onClick={() => handleReorderStage(stage.id, 'up')}
                      disabled={stage.order === 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para esquerda"
                    >
                      <ChevronUp className="h-3 w-3 text-gray-500 rotate-[-90deg]" />
                    </button>
                    <button
                      onClick={() => handleReorderStage(stage.id, 'down')}
                      disabled={stage.order === stages.length}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para direita"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-500 rotate-[-90deg]" />
                    </button>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => handleOpenStageModal(stage)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Editar etapa"
                    >
                      <Edit className="h-3 w-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Deletar etapa"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                  <p className="text-sm text-green-600 font-medium mt-1">
                    {formatCurrency(stage.totalValue)}
                  </p>
                </div>

                {/* Deals */}
                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={(e) => {
                        // Não abrir se clicou no menu
                        if ((e.target as HTMLElement).closest('button')) return
                        handleOpenDealModal(undefined, deal)
                      }}
                      className="bg-white rounded-lg shadow-sm border p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 text-sm">{deal.title}</h4>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDealMenu(showDealMenu === deal.id ? null : deal.id)
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                          {showDealMenu === deal.id && (
                            <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg z-10 py-1 w-32">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenDealModal(undefined, deal)
                                  setShowDealMenu(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDeal(deal.id)
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {deal.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{deal.description}</p>
                      )}
                      
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span className="truncate">{deal.contact.name}</span>
                      </div>
                      
                      {deal.expectedCloseDate && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(deal.expectedCloseDate)}</span>
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(deal.amount)}
                        </span>
                        {deal.probability && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Percent className="h-3 w-3 mr-1" />
                            {deal.probability}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {stage.deals.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">Nenhum deal</p>
                      <p className="text-xs">Arraste deals para cá</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {stages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum estágio configurado</p>
                  <button
                    onClick={async () => {
                      const apiUrl = getApiUrl()
                      await fetch(`${apiUrl}/api/pipeline/seed`, { method: 'POST' })
                      fetchPipeline()
                    }}
                    className="mt-2 text-green-600 hover:underline"
                  >
                    Criar estágios padrão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingDeal ? 'Editar Deal' : 'Novo Deal'}
              </h2>
              <button onClick={() => setShowDealModal(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: Matrícula João Silva"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contato *
                  </label>
                  <select
                    value={dealForm.contactId}
                    onChange={(e) => setDealForm({ ...dealForm, contactId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    {/* Se editando, garantir que o contato atual está na lista */}
                    {editingDeal && editingDeal.contact && !contacts.find(c => c.id === editingDeal.contact.id) && (
                      <option key={editingDeal.contact.id} value={editingDeal.contact.id}>
                        {editingDeal.contact.name}
                      </option>
                    )}
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estágio *
                  </label>
                  <select
                    value={dealForm.stageId}
                    onChange={(e) => setDealForm({ ...dealForm, stageId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    value={dealForm.amount}
                    onChange={(e) => setDealForm({ ...dealForm, amount: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Probabilidade (%)
                  </label>
                  <input
                    type="number"
                    value={dealForm.probability}
                    onChange={(e) => setDealForm({ ...dealForm, probability: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previsão de Fechamento
                  </label>
                  <input
                    type="date"
                    value={dealForm.expectedCloseDate}
                    onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origem
                  </label>
                  <select
                    value={dealForm.source}
                    onChange={(e) => setDealForm({ ...dealForm, source: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Selecione...</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google">Google</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Site">Site</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={dealForm.description}
                  onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Detalhes sobre a oportunidade..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingDeal ? 'Atualizar' : 'Criar Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
              </h3>
              <button
                onClick={() => setShowStageModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  value={stageForm.name}
                  onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: Novo Lead, Em Negociação..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stageForm.color}
                    onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={stageForm.color}
                    onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-2 font-mono text-sm"
                    placeholder="#6B7280"
                  />
                  <Palette className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Cor do indicador da etapa</p>
              </div>

              {editingStage && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Ordem atual:</strong> {editingStage.order} de {stages.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Negócios:</strong> {editingStage.dealCount}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingStage ? 'Atualizar' : 'Criar Etapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}