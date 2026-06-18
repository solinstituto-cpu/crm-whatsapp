'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getApiUrl } from '@/lib/api-config'
import { fetchUserWhatsAppAccounts, resolveDefaultAccountId } from '@/lib/whatsapp-accounts'
import { useRequirePermission } from '@/hooks/use-require-permission'
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  Search,
  X,
  ChevronDown,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Upload,
  Image,
  Video,
  FileText,
  Phone,
  Smartphone,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  templateName: string
  templateLanguage: string
  filterTags?: string
  filterStatus?: string
  excludeOptOut: boolean
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  totalContacts: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  sendRatePerMinute: number
  createdAt: string
  whatsappAccountId?: string
  whatsappAccount?: { id: string; name: string; phoneNumber: string }
}

interface Template {
  name: string
  language: string
  status: string
  category: string
  bodyText?: string
  headerText?: string
  components?: any[]
}

// Função para extrair variáveis do texto do template ({{1}}, {{2}}, etc)
const extractVariables = (text: string): string[] => {
  const matches = text?.match(/\{\{(\d+)\}\}/g) || []
  return [...new Set(matches)].sort()
}

// Opções de campos do contato para mapear variáveis
const CONTACT_FIELDS = [
  { value: 'name', label: 'Nome do Contato' },
  { value: 'phoneE164', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Empresa' },
  { value: 'city', label: 'Cidade' },
  { value: 'customerStatus', label: 'Status' },
  { value: 'custom', label: 'Texto personalizado' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho' },
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Agendada' },
  RUNNING: { bg: 'bg-green-100', text: 'text-green-800', label: 'Em execução' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pausada' },
  COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Concluída' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
}

export default function CampaignsPage() {
  const { data: session, status } = useSession()
  useRequirePermission('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState({
    campaigns: { total: 0, draft: 0, scheduled: 0, running: 0, completed: 0 },
    messages: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
  })

  // Modal states
  const [showNewModal, setShowNewModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [previewContacts, setPreviewContacts] = useState<any[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)

  // Form states
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTemplate, setFormTemplate] = useState('')
  const [formTemplateLanguage, setFormTemplateLanguage] = useState('pt_BR')
  const [formFilterTags, setFormFilterTags] = useState<string[]>([])
  const [formFilterStatus, setFormFilterStatus] = useState('')
  const [formFilterCustomFields, setFormFilterCustomFields] = useState<Record<string, string>>({})
  const [formExcludeOptOut, setFormExcludeOptOut] = useState(true)
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [formSendRate, setFormSendRate] = useState(10)
  const [formSendStartHour, setFormSendStartHour] = useState<number | null>(null)
  const [formSendEndHour, setFormSendEndHour] = useState<number | null>(null)
  const [formSendDays, setFormSendDays] = useState<number[]>([1, 2, 3, 4, 5]) // Seg-Sex por padrão
  const [saving, setSaving] = useState(false)
  
  // Campos customizados disponíveis
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<any[]>([])
  
  // Tags disponíveis para filtro
  const [availableTags, setAvailableTags] = useState<string[]>([])
  
  // Variáveis do template
  const [selectedTemplateData, setSelectedTemplateData] = useState<Template | null>(null)
  const [headerVariables, setHeaderVariables] = useState<Record<string, { type: string, value: string }>>({})
  const [bodyVariables, setBodyVariables] = useState<Record<string, { type: string, value: string }>>({})
  
  // Mídia do header (imagem, vídeo, documento)
  const [headerMediaType, setHeaderMediaType] = useState<string | null>(null)
  const [headerMediaUrl, setHeaderMediaUrl] = useState('')
  const [headerMediaFile, setHeaderMediaFile] = useState<File | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Filtros
  const [filterStatus, setFilterStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Contas WhatsApp (multi-números)
  const [whatsappAccounts, setWhatsappAccounts] = useState<{id: string, name: string, phoneNumber: string, isDefault: boolean}[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [filterAccountId, setFilterAccountId] = useState<string>('')
  const [accountsLoaded, setAccountsLoaded] = useState(false)

  // Carregar conta selecionada do localStorage no mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_selectedAccountId')
      if (stored) {
        setSelectedAccountId(stored)
        setFilterAccountId(stored)
      }
    }
  }, [])

  // Quando o filterAccountId muda (seletor de filtro), salvar no localStorage e sincronizar selectedAccountId
  const handleFilterAccountChange = (newAccountId: string) => {
    setFilterAccountId(newAccountId)
    setSelectedAccountId(newAccountId)
    if (typeof window !== 'undefined' && newAccountId) {
      localStorage.setItem('crm_selectedAccountId', newAccountId)
    }
    // Recarregar templates da nova conta
    fetchTemplates(newAccountId)
  }

  // Sincronizar quando outra aba altera localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'crm_selectedAccountId' && e.newValue) {
        setSelectedAccountId(e.newValue)
        setFilterAccountId(e.newValue)
      }
    }
    
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
    if (status === 'authenticated' && session) {
      fetchCampaigns()
      fetchStats()
      fetchCustomFields()
      fetchAvailableTags()
      fetchWhatsAppAccounts()
    }
  }, [status, session])

  // Re-fetch quando muda o filtro de conta ou status
  useEffect(() => {
    if (status === 'authenticated' && accountsLoaded) {
      fetchCampaigns()
      fetchStats()
    }
  }, [filterAccountId, filterStatus])
  
  // Buscar contas WhatsApp (multi-números)
  const fetchWhatsAppAccounts = async () => {
    try {
      const userId = (session?.user as any)?.id
      const accounts = await fetchUserWhatsAppAccounts(userId)
      setWhatsappAccounts(accounts)

      const savedAccountId = typeof window !== 'undefined'
        ? localStorage.getItem('crm_selectedAccountId')
        : null
      if (accounts.length > 0) {
        const activeId = resolveDefaultAccountId(accounts, savedAccountId)
        setSelectedAccountId(activeId)
        setFilterAccountId(activeId)
        fetchTemplates(activeId)
      }
    } catch (error) {
      console.error('Erro ao buscar contas WhatsApp:', error)
    } finally {
      setAccountsLoaded(true)
    }
  }

  const fetchCustomFields = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/settings/custom-fields`)
      if (response.ok) {
        const data = await response.json()
        setCustomFieldDefinitions(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar campos customizados:', error)
    }
  }

  // Buscar todas as tags únicas dos contatos
  const fetchAvailableTags = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/contacts?limit=1000`)
      if (response.ok) {
        const data = await response.json()
        const contacts = data.contacts || data || []
        // Extrair tags únicas
        const allTags = new Set<string>()
        contacts.forEach((c: any) => {
          if (c.tags && Array.isArray(c.tags)) {
            c.tags.forEach((tag: string) => allTags.add(tag))
          }
        })
        setAvailableTags(Array.from(allTags).sort())
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const apiUrl = getApiUrl()
      const params = new URLSearchParams({ limit: '100' })
      if (filterStatus) params.append('status', filterStatus)
      if (filterAccountId) params.append('accountId', filterAccountId)
      
      const response = await fetch(`${apiUrl}/api/campaigns?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async (accountId?: string) => {
    try {
      const apiUrl = getApiUrl()
      // Se tiver accountId, buscar templates daquela conta específica
      const params = accountId ? `?accountId=${accountId}` : ''
      const response = await fetch(`${apiUrl}/api/templates${params}`)
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas templates aprovados e guardar dados completos
        setTemplates(data.filter((t: Template) => t.status === 'APPROVED'))
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  // Quando seleciona um template, extrair variáveis
  const handleSelectTemplate = (templateName: string) => {
    setFormTemplate(templateName)
    const template = templates.find(t => t.name === templateName)
    if (template) {
      setFormTemplateLanguage(template.language)
      setSelectedTemplateData(template)
      
      // Detectar tipo de mídia no header
      const headerComponent = template.components?.find((c: any) => c.type === 'HEADER')
      if (headerComponent) {
        const format = headerComponent.format?.toUpperCase()
        if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(format)) {
          setHeaderMediaType(format)
        } else {
          setHeaderMediaType(null)
        }
      } else {
        setHeaderMediaType(null)
      }
      setHeaderMediaUrl('')
      setHeaderMediaFile(null)
      
      // Extrair variáveis do header
      const headerVars = extractVariables(template.headerText || '')
      const newHeaderVars: Record<string, { type: string, value: string }> = {}
      headerVars.forEach(v => {
        newHeaderVars[v] = { type: 'name', value: '' }
      })
      setHeaderVariables(newHeaderVars)
      
      // Extrair variáveis do body
      const bodyVars = extractVariables(template.bodyText || '')
      const newBodyVars: Record<string, { type: string, value: string }> = {}
      bodyVars.forEach(v => {
        newBodyVars[v] = { type: 'name', value: '' }
      })
      setBodyVariables(newBodyVars)
    } else {
      setSelectedTemplateData(null)
      setHeaderVariables({})
      setBodyVariables({})
      setHeaderMediaType(null)
      setHeaderMediaUrl('')
      setHeaderMediaFile(null)
    }
  }

  // Upload de mídia para o servidor
  const handleMediaUpload = async (file: File) => {
    setUploadingMedia(true)
    try {
      const apiUrl = getApiUrl()
      const formData = new FormData()
      formData.append('file', file)
      
      const url = selectedAccountId 
        ? `${apiUrl}/api/wa/upload-media?accountId=${selectedAccountId}`
        : `${apiUrl}/api/wa/upload-media`
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Upload response:', data)
        // Backend retorna { mediaId: string }
        const mediaId = data.mediaId || data.id || data.url
        if (mediaId) {
          setHeaderMediaUrl(mediaId)
          setHeaderMediaFile(file)
          console.log('Media ID salvo:', mediaId)
        } else {
          alert('Erro: ID da mídia não retornado pelo servidor')
        }
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao fazer upload')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload da mídia')
    } finally {
      setUploadingMedia(false)
    }
  }

  const fetchStats = async () => {
    try {
      const apiUrl = getApiUrl()
      const url = filterAccountId 
        ? `${apiUrl}/api/campaigns/stats?accountId=${filterAccountId}`
        : `${apiUrl}/api/campaigns/stats`
      const response = await fetch(url)
      if (response.ok) {
        setStats(await response.json())
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const fetchPreviewContacts = async () => {
    try {
      const apiUrl = getApiUrl()
      let finalAccountId = selectedAccountId
      if (!finalAccountId && whatsappAccounts.length > 0) {
        const defaultAcc = whatsappAccounts.find((a: any) => a.isDefault) || whatsappAccounts[0]
        finalAccountId = defaultAcc.id
      }

      const response = await fetch(`${apiUrl}/api/campaigns/preview-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterTags: formFilterTags.length > 0 ? formFilterTags : undefined,
          filterStatus: formFilterStatus || undefined,
          excludeOptOut: formExcludeOptOut,
          whatsappAccountId: finalAccountId || undefined,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setPreviewContacts(data.contacts || [])
        setPreviewTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Erro ao preview contatos:', error)
    }
  }

  const handleCreateCampaign = async () => {
    if (!formName.trim() || !formTemplate) {
      alert('Preencha o nome e selecione um template')
      return
    }

    // Validar se template precisa de mídia mas não foi enviada
    if (headerMediaType && !headerMediaUrl) {
      alert(`Este template requer uma ${headerMediaType === 'IMAGE' ? 'imagem' : headerMediaType === 'VIDEO' ? 'vídeo' : 'documento'} no cabeçalho. Por favor, faça o upload.`)
      return
    }

    // VALIDAÇÃO OBRIGATÓRIA: garantir que uma conta WhatsApp está selecionada
    let finalAccountId = selectedAccountId
    if (!finalAccountId && whatsappAccounts.length > 0) {
      const defaultAcc = whatsappAccounts.find((a: any) => a.isDefault) || whatsappAccounts[0]
      finalAccountId = defaultAcc.id
    }
    if (!finalAccountId) {
      alert('Erro: Nenhuma conta WhatsApp selecionada. Configure uma conta em Configurações.')
      return
    }

    const selectedAccName = whatsappAccounts.find(a => a.id === finalAccountId)?.name || finalAccountId
    console.log(`🚀 Criando campanha "${formName}" com conta: ${selectedAccName} (${finalAccountId})`)

    // Montar variáveis do template
    const templateVariables: any = {
      header: Object.entries(headerVariables).map(([key, val]) => ({
        variable: key,
        type: val.type,
        value: val.value,
      })),
      body: Object.entries(bodyVariables).map(([key, val]) => ({
        variable: key,
        type: val.type,
        value: val.value,
      })),
    }

    // Adicionar mídia do header se existir
    if (headerMediaType && headerMediaUrl) {
      templateVariables.headerMedia = {
        type: headerMediaType.toLowerCase(),
        url: headerMediaUrl,
      }
      console.log('Header media configurada:', templateVariables.headerMedia)
    } else if (headerMediaType) {
      console.warn('Template precisa de mídia mas headerMediaUrl está vazio:', headerMediaUrl)
    }

    console.log('templateVariables final:', JSON.stringify(templateVariables))

    // Converter horário local para ISO com timezone do Brasil
    let scheduledAtISO: string | undefined = undefined
    if (formScheduledAt) {
      // formScheduledAt é no formato "2026-01-25T16:00" (horário local do Brasil)
      // Precisamos converter para UTC considerando que é horário de Brasília (UTC-3)
      const localDate = new Date(formScheduledAt)
      // O navegador já interpreta como horário local, então só convertemos para ISO
      scheduledAtISO = localDate.toISOString()
      console.log('Agendamento:', formScheduledAt, '-> ISO:', scheduledAtISO)
    }

    setSaving(true)
    try {
      const apiUrl = getApiUrl()

      const campaignPayload = {
        name: formName,
        description: formDescription,
        templateName: formTemplate,
        templateLanguage: formTemplateLanguage,
        templateVariables,
        filterTags: formFilterTags.length > 0 ? formFilterTags : undefined,
        filterStatus: formFilterStatus || undefined,
        filterCustomFields: Object.keys(formFilterCustomFields).length > 0 ? formFilterCustomFields : undefined,
        excludeOptOut: formExcludeOptOut,
        scheduledAt: scheduledAtISO,
        sendRatePerMinute: formSendRate,
        sendStartHour: formSendStartHour,
        sendEndHour: formSendEndHour,
        sendDays: formSendDays.length > 0 ? formSendDays.join(',') : undefined,
        whatsappAccountId: finalAccountId, // SEMPRE enviar o accountId
      }

      console.log('📤 Payload da campanha:', JSON.stringify({ ...campaignPayload, templateVariables: '...' }))

      const response = await fetch(`${apiUrl}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload),
      })

      if (response.ok) {
        const newCampaign = await response.json()
        setCampaigns([newCampaign, ...campaigns])
        setShowNewModal(false)
        resetForm()
        fetchStats()
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao criar campanha')
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      alert('Erro ao criar campanha')
    } finally {
      setSaving(false)
    }
  }

  const handleStartCampaign = async (id: string) => {
    if (!confirm('Iniciar envio da campanha?')) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/campaigns/${id}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        setCampaigns(campaigns.map(c => 
          c.id === id ? { ...c, status: 'RUNNING' } : c
        ))
        fetchStats()
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao iniciar campanha')
      }
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error)
    }
  }

  const handlePauseCampaign = async (id: string) => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/campaigns/${id}/pause`, {
        method: 'POST',
      })

      if (response.ok) {
        setCampaigns(campaigns.map(c => 
          c.id === id ? { ...c, status: 'PAUSED' } : c
        ))
        fetchStats()
      }
    } catch (error) {
      console.error('Erro ao pausar campanha:', error)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Excluir esta campanha?')) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/campaigns/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id))
        fetchStats()
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao excluir campanha')
      }
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormTemplate('')
    setFormTemplateLanguage('pt_BR')
    setFormFilterTags([])
    setFormFilterStatus('')
    setFormFilterCustomFields({})
    setFormExcludeOptOut(true)
    setFormScheduledAt('')
    setFormSendRate(10)
    setFormSendStartHour(null)
    setFormSendEndHour(null)
    setFormSendDays([1, 2, 3, 4, 5]) // Seg-Sex padrão
    setPreviewContacts([])
    setPreviewTotal(0)
    setSelectedTemplateData(null)
    setHeaderVariables({})
    setBodyVariables({})
    setHeaderMediaType(null)
    setHeaderMediaUrl('')
    setHeaderMediaFile(null)
  }

  const openDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowDetailsModal(true)
  }

  const filteredCampaigns = campaigns.filter(c => {
    // Filtro por texto (filtragem por conta já é server-side)
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando campanhas...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Megaphone className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
              <p className="text-gray-500">Envie mensagens em massa para seus contatos</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Campanha
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold">{stats.campaigns.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Em execução</p>
                <p className="text-xl font-bold text-green-600">{stats.campaigns.running}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Agendadas</p>
                <p className="text-xl font-bold text-blue-600">{stats.campaigns.scheduled}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Concluídas</p>
                <p className="text-xl font-bold text-purple-600">{stats.campaigns.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Send className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Msgs enviadas</p>
                <p className="text-xl font-bold text-yellow-600">{(stats.messages.sent || 0) + (stats.messages.delivered || 0) + (stats.messages.read || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar campanhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                fetchCampaigns()
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos os status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="RUNNING">Em execução</option>
              <option value="PAUSED">Pausada</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
            {/* Filtro por Conta WhatsApp */}
            {whatsappAccounts.length > 0 && (
              <select
                value={filterAccountId}
                onChange={(e) => handleFilterAccountChange(e.target.value)}
                className="px-4 py-2 border border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50 font-medium"
              >
                {whatsappAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    📱 {account.name} {account.phoneNumber ? `(${account.phoneNumber})` : ''}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                fetchCampaigns()
                fetchStats()
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Atualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Campanhas</h2>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma campanha encontrada</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Criar primeira campanha
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => {
                const statusInfo = STATUS_COLORS[campaign.status] || STATUS_COLORS.DRAFT
                const progress = campaign.totalContacts > 0 
                  ? Math.round((campaign.sentCount / campaign.totalContacts) * 100) 
                  : 0

                return (
                  <div key={campaign.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                          {/* Indicador de qual número WhatsApp */}
                          {campaign.whatsappAccount && (
                            <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                              <Phone className="h-3 w-3 mr-1" />
                              {campaign.whatsappAccount.phoneNumber || campaign.whatsappAccount.name}
                            </span>
                          )}
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {campaign.templateName}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {campaign.totalContacts} contatos
                          </span>
                          {campaign.scheduledAt && (
                            <span className="flex items-center text-blue-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(campaign.scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                            </span>
                          )}
                        </div>

                        {/* Progress bar for running campaigns */}
                        {campaign.status === 'RUNNING' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-500">Progresso</span>
                              <span className="font-medium">{campaign.sentCount}/{campaign.totalContacts} ({progress}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stats for completed campaigns */}
                        {(campaign.status === 'COMPLETED' || campaign.sentCount > 0) && (
                          <div className="flex items-center space-x-4 mt-3 text-sm">
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {campaign.sentCount} enviados
                            </span>
                            <span className="flex items-center text-blue-600">
                              <Send className="h-4 w-4 mr-1" />
                              {campaign.deliveredCount} entregues
                            </span>
                            <span className="flex items-center text-purple-600">
                              <Eye className="h-4 w-4 mr-1" />
                              {campaign.readCount} lidos
                            </span>
                            {campaign.failedCount > 0 && (
                              <span className="flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                {campaign.failedCount} falhas
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {/* Ações baseadas no status */}
                        {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' || campaign.status === 'PAUSED') && (
                          (() => {
                            const isScheduledForFuture = campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()
                            return (
                              <button
                                onClick={() => handleStartCampaign(campaign.id)}
                                disabled={isScheduledForFuture}
                                className={`p-2 rounded-lg ${
                                  isScheduledForFuture 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                }`}
                                title={isScheduledForFuture 
                                  ? `Agendada para ${new Date(campaign.scheduledAt!).toLocaleString('pt-BR')}` 
                                  : 'Iniciar'
                                }
                              >
                                {isScheduledForFuture ? <Clock className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                              </button>
                            )
                          })()
                        )}
                        {campaign.status === 'RUNNING' && (
                          <button
                            onClick={() => handlePauseCampaign(campaign.id)}
                            className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                            title="Pausar"
                          >
                            <Pause className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => openDetails(campaign)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          title="Ver detalhes"
                        >
                          <BarChart3 className="h-5 w-5" />
                        </button>
                        {campaign.status !== 'RUNNING' && (
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal: Nova Campanha */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Nova Campanha</h2>
                <button onClick={() => { setShowNewModal(false); resetForm() }}>
                  <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Campanha *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Promoção de Janeiro"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Descrição opcional da campanha"
                  />
                </div>
                
                {/* Conta WhatsApp (Multi-números) */}
                {whatsappAccounts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Smartphone className="inline h-4 w-4 mr-1" />
                      Número WhatsApp *
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => {
                        const newId = e.target.value
                        setSelectedAccountId(newId)
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('crm_selectedAccountId', newId)
                        }
                        // Limpar template selecionado quando mudar de conta (templates podem ser diferentes)
                        setFormTemplate('')
                        setSelectedTemplateData(null)
                        // Recarregar templates da nova conta
                        fetchTemplates(newId)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {whatsappAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} {account.phoneNumber ? `(${account.phoneNumber})` : ''} {account.isDefault ? '⭐' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Este número será usado para disparar a campanha
                    </p>
                  </div>
                )}

                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template *
                  </label>
                  <select
                    value={formTemplate}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecione um template</option>
                    {templates.map((template) => (
                      <option key={template.name} value={template.name}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="text-sm text-yellow-600 mt-1">
                      ⚠️ Nenhum template aprovado encontrado
                    </p>
                  )}
                </div>

                {/* Preview do Template e Variáveis */}
                {selectedTemplateData && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">📝 Prévia do Template</h4>
                    
                    {/* Upload de Mídia do Header */}
                    {headerMediaType && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-green-300">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          {headerMediaType === 'IMAGE' && '🖼️ Imagem do Cabeçalho'}
                          {headerMediaType === 'VIDEO' && '🎥 Vídeo do Cabeçalho'}
                          {headerMediaType === 'DOCUMENT' && '📄 Documento do Cabeçalho'}
                          <span className="text-red-500 ml-1">*</span>
                        </h5>
                        
                        {!headerMediaFile ? (
                          <div>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-500">
                                  {uploadingMedia ? 'Enviando...' : 'Clique para fazer upload'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {headerMediaType === 'IMAGE' && 'JPG, PNG até 5MB'}
                                  {headerMediaType === 'VIDEO' && 'MP4 até 16MB'}
                                  {headerMediaType === 'DOCUMENT' && 'PDF até 100MB'}
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept={
                                  headerMediaType === 'IMAGE' ? 'image/jpeg,image/png' :
                                  headerMediaType === 'VIDEO' ? 'video/mp4' :
                                  'application/pdf'
                                }
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleMediaUpload(file)
                                }}
                                disabled={uploadingMedia}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              {headerMediaType === 'IMAGE' && <span className="text-2xl mr-2">🖼️</span>}
                              {headerMediaType === 'VIDEO' && <span className="text-2xl mr-2">🎥</span>}
                              {headerMediaType === 'DOCUMENT' && <span className="text-2xl mr-2">📄</span>}
                              <div>
                                <p className="text-sm font-medium text-gray-700">{headerMediaFile.name}</p>
                                <p className="text-xs text-gray-500">{(headerMediaFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setHeaderMediaFile(null)
                                setHeaderMediaUrl('')
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Header */}
                    {selectedTemplateData.headerText && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 uppercase">Cabeçalho:</span>
                        <p className="text-sm font-medium">{selectedTemplateData.headerText}</p>
                      </div>
                    )}
                    
                    {/* Body */}
                    {selectedTemplateData.bodyText && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 uppercase">Corpo:</span>
                        <p className="text-sm whitespace-pre-wrap">{selectedTemplateData.bodyText}</p>
                      </div>
                    )}

                    {/* Variáveis do Header */}
                    {Object.keys(headerVariables).length > 0 && (
                      <div className="mt-4 border-t border-green-200 pt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Variáveis do Cabeçalho:</h5>
                        {Object.entries(headerVariables).map(([varKey, varVal]) => (
                          <div key={varKey} className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600 w-16">{varKey}:</span>
                            <select
                              value={varVal.type}
                              onChange={(e) => setHeaderVariables(prev => ({
                                ...prev,
                                [varKey]: { ...prev[varKey], type: e.target.value, value: e.target.value === 'custom' ? '' : '' }
                              }))}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            >
                              {CONTACT_FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                            {varVal.type === 'custom' && (
                              <input
                                type="text"
                                value={varVal.value}
                                onChange={(e) => setHeaderVariables(prev => ({
                                  ...prev,
                                  [varKey]: { ...prev[varKey], value: e.target.value }
                                }))}
                                placeholder="Texto fixo"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Variáveis do Body */}
                    {Object.keys(bodyVariables).length > 0 && (
                      <div className="mt-4 border-t border-green-200 pt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Variáveis do Corpo:</h5>
                        {Object.entries(bodyVariables).map(([varKey, varVal]) => (
                          <div key={varKey} className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600 w-16">{varKey}:</span>
                            <select
                              value={varVal.type}
                              onChange={(e) => setBodyVariables(prev => ({
                                ...prev,
                                [varKey]: { ...prev[varKey], type: e.target.value, value: e.target.value === 'custom' ? '' : '' }
                              }))}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            >
                              {CONTACT_FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                            {varVal.type === 'custom' && (
                              <input
                                type="text"
                                value={varVal.value}
                                onChange={(e) => setBodyVariables(prev => ({
                                  ...prev,
                                  [varKey]: { ...prev[varKey], value: e.target.value }
                                }))}
                                placeholder="Texto fixo"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(headerVariables).length === 0 && Object.keys(bodyVariables).length === 0 && (
                      <p className="text-sm text-gray-500 italic mt-2">
                        ✅ Este template não possui variáveis
                      </p>
                    )}
                  </div>
                )}

                {/* Filtros */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Segmentação de Contatos
                  </h3>

                  {/* Filtro por Tags */}
                  {availableTags.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏷️ Filtrar por Tags
                      </label>
                      <select
                        onChange={(e) => {
                          const tag = e.target.value;
                          if (tag && !formFilterTags.includes(tag)) {
                            setFormFilterTags([...formFilterTags, tag]);
                          }
                          // Reseta para a opção inicial para permitir selecionar a mesma opção novamente se for removida
                          e.target.value = "";
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Selecione uma tag para adicionar</option>
                        {[...availableTags].sort((a, b) => a.localeCompare(b)).map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                      
                      {/* Tags selecionadas */}
                      {formFilterTags.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">Tags selecionadas (clique no X para remover):</p>
                          <div className="flex flex-wrap gap-2">
                            {formFilterTags.map((tag) => (
                              <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => setFormFilterTags(formFilterTags.filter(t => t !== tag))}
                                  className="ml-2 text-green-600 hover:text-green-900 focus:outline-none"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status do Cliente
                      </label>
                      <select
                        value={formFilterStatus}
                        onChange={(e) => setFormFilterStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Todos</option>
                        <option value="Lead">Lead</option>
                        <option value="Cliente">Cliente</option>
                        <option value="Ex-cliente">Ex-cliente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Velocidade de Envio
                      </label>
                      <select
                        value={formSendRate}
                        onChange={(e) => setFormSendRate(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value={5}>5 msgs/min (conservador)</option>
                        <option value={10}>10 msgs/min (recomendado)</option>
                        <option value={20}>20 msgs/min (rápido)</option>
                        <option value={30}>30 msgs/min (agressivo)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formExcludeOptOut}
                        onChange={(e) => setFormExcludeOptOut(e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Excluir contatos que deram opt-out
                      </span>
                    </label>
                  </div>

                  {/* Filtro por campos personalizados */}
                  {customFieldDefinitions.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrar por Campo Personalizado
                      </label>
                      <div className="space-y-2">
                        {customFieldDefinitions.map((field: any) => (
                          <div key={field.id} className="flex gap-2">
                            <span className="text-sm text-gray-600 w-32 py-2">{field.label}:</span>
                            {field.type === 'select' && field.options ? (
                              <select
                                value={formFilterCustomFields[field.name] || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setFormFilterCustomFields({...formFilterCustomFields, [field.name]: e.target.value})
                                  } else {
                                    const newFields = {...formFilterCustomFields}
                                    delete newFields[field.name]
                                    setFormFilterCustomFields(newFields)
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">Qualquer valor</option>
                                {field.options.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Valor para filtrar"
                                value={formFilterCustomFields[field.name] || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setFormFilterCustomFields({...formFilterCustomFields, [field.name]: e.target.value})
                                  } else {
                                    const newFields = {...formFilterCustomFields}
                                    delete newFields[field.name]
                                    setFormFilterCustomFields(newFields)
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="mt-4">
                    <button
                      onClick={fetchPreviewContacts}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Ver contatos que receberão ({previewTotal} encontrados)
                    </button>
                    {previewContacts.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2 text-sm">
                        {previewContacts.slice(0, 10).map((c, i) => (
                          <div key={i} className="py-1">
                            {c.name} - {c.phoneE164}
                          </div>
                        ))}
                        {previewTotal > 10 && (
                          <div className="text-gray-500 py-1">
                            ... e mais {previewTotal - 10} contatos
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agendamento */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Agendar envio (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Deixe em branco para salvar como rascunho
                  </p>

                  {/* Horário comercial para envio */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🕐 Horário permitido para envio (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={formSendStartHour ?? ''}
                        onChange={(e) => setFormSendStartHour(e.target.value ? Number(e.target.value) : null)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Início</option>
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                      <span className="text-gray-500">até</span>
                      <select
                        value={formSendEndHour ?? ''}
                        onChange={(e) => setFormSendEndHour(e.target.value ? Number(e.target.value) : null)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Fim</option>
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ex: 08:00 até 18:00 - envios fora desse horário serão pausados automaticamente
                    </p>
                  </div>
                  
                  {/* Dias da semana para envio */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Dias permitidos para envio
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 0, label: 'Dom' },
                        { value: 1, label: 'Seg' },
                        { value: 2, label: 'Ter' },
                        { value: 3, label: 'Qua' },
                        { value: 4, label: 'Qui' },
                        { value: 5, label: 'Sex' },
                        { value: 6, label: 'Sáb' },
                      ].map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            if (formSendDays.includes(day.value)) {
                              setFormSendDays(formSendDays.filter(d => d !== day.value))
                            } else {
                              setFormSendDays([...formSendDays, day.value].sort())
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            formSendDays.includes(day.value)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Clique para selecionar/deselecionar os dias. Padrão: Seg-Sex.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => { setShowNewModal(false); resetForm() }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={saving || !formName.trim() || !formTemplate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Criando...' : formScheduledAt ? 'Agendar Campanha' : 'Salvar Rascunho'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Detalhes da Campanha */}
        {showDetailsModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{selectedCampaign.name}</h2>
                <button onClick={() => setShowDetailsModal(false)}>
                  <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedCampaign.status]?.bg} ${STATUS_COLORS[selectedCampaign.status]?.text}`}>
                    {STATUS_COLORS[selectedCampaign.status]?.label}
                  </span>
                  {selectedCampaign.scheduledAt && (
                    <span className="text-sm text-gray-500">
                      Agendada para: {new Date(selectedCampaign.scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </span>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedCampaign.totalContacts}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedCampaign.sentCount}</p>
                    <p className="text-sm text-gray-500">Enviados</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCampaign.deliveredCount}</p>
                    <p className="text-sm text-gray-500">Entregues</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedCampaign.readCount}</p>
                    <p className="text-sm text-gray-500">Lidos</p>
                  </div>
                </div>

                {selectedCampaign.failedCount > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{selectedCampaign.failedCount}</p>
                    <p className="text-sm text-gray-500">Falhas</p>
                  </div>
                )}

                {/* Info */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <p><strong>Template:</strong> {selectedCampaign.templateName}</p>
                  <p><strong>Velocidade:</strong> {selectedCampaign.sendRatePerMinute} msgs/min</p>
                  {selectedCampaign.startedAt && (
                    <p><strong>Iniciada:</strong> {new Date(selectedCampaign.startedAt).toLocaleString('pt-BR')}</p>
                  )}
                  {selectedCampaign.completedAt && (
                    <p><strong>Concluída:</strong> {new Date(selectedCampaign.completedAt).toLocaleString('pt-BR')}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
