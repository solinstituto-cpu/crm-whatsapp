'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Phone
} from 'lucide-react'

interface MetaTemplate {
  id: string
  name: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED' | 'PAUSED'
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  bodyText: string
  headerText: string | null
  footerText: string | null
  components: any[]
  qualityScore: string | null
}

interface TemplateStats {
  total: number
  approved: number
  pending: number
  rejected: number
}

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const [templates, setTemplates] = useState<MetaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [stats, setStats] = useState<TemplateStats>({ total: 0, approved: 0, pending: 0, rejected: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for new template
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'UTILITY' as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
    language: 'pt_BR',
    headerType: 'none' as 'none' | 'text',
    headerText: '',
    bodyText: '',
    footerText: '',
  })
  const [creating, setCreating] = useState(false)

  // Estado para contas WhatsApp (multi-números)
  const [whatsappAccounts, setWhatsappAccounts] = useState<{id: string, name: string, phoneNumber: string, isDefault: boolean}[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crm_selectedAccountId') || ''
    }
    return ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWhatsAppAccounts()
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated' && selectedAccountId) {
      fetchTemplates()
    }
  }, [status, selectedAccountId])

  // Persistir conta selecionada
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedAccountId) {
      localStorage.setItem('crm_selectedAccountId', selectedAccountId)
    }
  }, [selectedAccountId])

  const fetchWhatsAppAccounts = async () => {
    const apiUrl = getApiUrl()
    const userId = (session?.user as any)?.id
    const token = (session?.user as any)?.token
    try {
      const url = userId 
        ? `${apiUrl}/api/whatsapp-accounts?userId=${userId}`
        : `${apiUrl}/api/whatsapp-accounts`
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        const data = await res.json()
        const accounts = data.map((a: any) => ({
          id: a.id,
          name: a.name,
          phoneNumber: a.phoneNumber || '',
          isDefault: a.isDefault
        }))
        setWhatsappAccounts(accounts)
        
        // Restaurar do localStorage ou usar conta padrão
        const savedAccountId = typeof window !== 'undefined' ? localStorage.getItem('crm_selectedAccountId') : null
        if (!selectedAccountId && accounts.length > 0) {
          const savedAccount = savedAccountId ? accounts.find((a: any) => a.id === savedAccountId) : null
          if (savedAccount) {
            setSelectedAccountId(savedAccount.id)
          } else {
            const defaultAcc = accounts.find((a: any) => a.isDefault)
            setSelectedAccountId(defaultAcc?.id || accounts[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar contas WhatsApp:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      setError(null)
      const apiUrl = getApiUrl()
      
      // Adicionar timeout de 15 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const accountIdParam = selectedAccountId ? `&accountId=${selectedAccountId}` : ''
      console.log('Fetching templates from:', `${apiUrl}/api/templates?limit=100${accountIdParam}`)
      
      const token = (session?.user as any)?.token
      const response = await fetch(`${apiUrl}/api/templates${accountIdParam ? '?' + accountIdParam.substring(1) : ''}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.message || `API Error: ${response.status} ${response.statusText}`
        throw new Error(errorMsg)
      }

      const data = await response.json()
      console.log('Templates received:', data)
      setTemplates(data)
      
      // Calculate stats
      setStats({
        total: data.length,
        approved: data.filter((t: MetaTemplate) => t.status === 'APPROVED').length,
        pending: data.filter((t: MetaTemplate) => t.status === 'PENDING').length,
        rejected: data.filter((t: MetaTemplate) => t.status === 'REJECTED').length,
      })
      
      setLoading(false)
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error)
      if (error.name === 'AbortError') {
        setError('Timeout: A API demorou muito para responder. Verifique se o Render está ativo.')
      } else {
        setError(error.message || 'Erro ao carregar templates do Meta')
      }
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTemplates()
    setRefreshing(false)
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.bodyText) {
      alert('Nome e corpo do template são obrigatórios')
      return
    }

    setCreating(true)
    try {
      const apiUrl = getApiUrl()
      
      // Build components array
      const components: any[] = []
      
      if (newTemplate.headerType === 'text' && newTemplate.headerText) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: newTemplate.headerText,
        })
      }
      
      components.push({
        type: 'BODY',
        text: newTemplate.bodyText,
      })
      
      if (newTemplate.footerText) {
        components.push({
          type: 'FOOTER',
          text: newTemplate.footerText,
        })
      }

      const token = (session?.user as any)?.token
      const response = await fetch(`${apiUrl}/api/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newTemplate.name.toLowerCase().replace(/\s+/g, '_'),
          category: newTemplate.category,
          language: newTemplate.language,
          components,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create template')
      }

      setShowCreateModal(false)
      setNewTemplate({
        name: '',
        category: 'UTILITY',
        language: 'pt_BR',
        headerType: 'none',
        headerText: '',
        bodyText: '',
        footerText: '',
      })
      await fetchTemplates()
      alert('Template criado e enviado para aprovação do Meta!')
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTemplate = async (templateName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${templateName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const apiUrl = getApiUrl()
      const token = (session?.user as any)?.token
      const response = await fetch(`${apiUrl}/api/templates/${templateName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete template')
      }

      await fetchTemplates()
    } catch (error: any) {
      console.error('Erro ao deletar template:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleCopyTemplate = (template: MetaTemplate) => {
    let text = ''
    if (template.headerText) text += template.headerText + '\n\n'
    text += template.bodyText
    if (template.footerText) text += '\n\n' + template.footerText
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (templateStatus: string) => {
    switch (templateStatus) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusLabel = (templateStatus: string) => {
    const labels: Record<string, string> = {
      'APPROVED': 'Aprovado',
      'PENDING': 'Pendente',
      'REJECTED': 'Rejeitado',
      'DISABLED': 'Desativado',
      'PAUSED': 'Pausado',
    }
    return labels[templateStatus] || templateStatus
  }

  const getStatusColor = (templateStatus: string) => {
    const colors: Record<string, string> = {
      'APPROVED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'DISABLED': 'bg-gray-100 text-gray-800',
      'PAUSED': 'bg-orange-100 text-orange-800',
    }
    return colors[templateStatus] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'MARKETING': 'Marketing',
      'UTILITY': 'Utilitário',
      'AUTHENTICATION': 'Autenticação',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'MARKETING': 'bg-purple-100 text-purple-800',
      'UTILITY': 'bg-blue-100 text-blue-800',
      'AUTHENTICATION': 'bg-indigo-100 text-indigo-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getLanguageLabel = (language: string) => {
    const labels: Record<string, string> = {
      'pt_BR': 'Português (BR)',
      'en_US': 'Inglês (US)',
      'es': 'Espanhol',
    }
    return labels[language] || language
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.bodyText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando templates do Meta...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="mr-3 h-8 w-8 text-green-600" />
                Templates do WhatsApp
              </h1>
              <p className="text-gray-600 mt-1">
                Templates aprovados pelo Meta para envio de mensagens
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Seletor de Conta WhatsApp */}
              {whatsappAccounts.length > 1 && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                  >
                    {whatsappAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <a
                href="https://business.facebook.com/wa/manage/message-templates/"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Meta Business
              </a>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">Erro ao carregar templates</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-xs mt-2">
                Verifique se as variáveis WHATSAPP_BUSINESS_ACCOUNT_ID e WHATSAPP_ACCESS_TOKEN estão configuradas corretamente.
              </p>
            </div>
          </div>
        )}

        {/* Info Alert */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-blue-800 font-medium">Sobre Templates do Meta</h4>
              <p className="text-blue-700 text-sm mt-1">
                Templates precisam ser aprovados pelo Meta antes de usar. O processo de aprovação pode levar de alguns minutos a 24 horas.
                Apenas templates aprovados podem ser usados para enviar mensagens fora da janela de 24 horas.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 mr-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 mr-3">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejeitados</p>
                <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Todas categorias</option>
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utilitário</option>
            <option value="AUTHENTICATION">Autenticação</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Todos status</option>
            <option value="APPROVED">Aprovados</option>
            <option value="PENDING">Pendentes</option>
            <option value="REJECTED">Rejeitados</option>
          </select>
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-4">
                {/* Header do template */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                        {getStatusIcon(template.status)}
                        <span className="ml-1">{getStatusLabel(template.status)}</span>
                      </span>
                    </div>
                    <div className="flex items-center mt-2 gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {getCategoryLabel(template.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getLanguageLabel(template.language)}
                      </span>
                      {template.qualityScore && (
                        <span className="text-xs text-gray-500">
                          Qualidade: {template.qualityScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyTemplate(template)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
                      title="Copiar conteúdo"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.name)}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100"
                      title="Excluir template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                    >
                      {expandedTemplate === template.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview compacto */}
                {expandedTemplate !== template.id && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {template.bodyText}
                  </p>
                )}

                {/* Conteúdo expandido */}
                {expandedTemplate === template.id && (
                  <div className="mt-4 space-y-3">
                    {template.headerText && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">HEADER</p>
                        <p className="text-sm text-gray-800">{template.headerText}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">BODY</p>
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                        {template.bodyText}
                      </pre>
                    </div>
                    {template.footerText && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">FOOTER</p>
                        <p className="text-sm text-gray-600">{template.footerText}</p>
                      </div>
                    )}
                    {template.status === 'APPROVED' && (
                      <div className="flex justify-end">
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Usar Template
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum template encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Tente uma busca diferente ou mude os filtros.' 
                : 'Crie seu primeiro template ou acesse o Meta Business para gerenciar.'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Template
              </button>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Criar Novo Template</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    <strong>Atenção:</strong> Templates criados aqui serão enviados para aprovação do Meta. 
                    O processo pode levar de alguns minutos a 24 horas.
                  </p>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Template *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Ex: confirmacao_pedido"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use apenas letras minúsculas, números e underscore
                  </p>
                </div>

                {/* Categoria e Idioma */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="UTILITY">Utilitário</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="AUTHENTICATION">Autenticação</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Idioma *
                    </label>
                    <select
                      value={newTemplate.language}
                      onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="pt_BR">Português (BR)</option>
                      <option value="en_US">Inglês (US)</option>
                      <option value="es">Espanhol</option>
                    </select>
                  </div>
                </div>

                {/* Header */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header (opcional)
                  </label>
                  <select
                    value={newTemplate.headerType}
                    onChange={(e) => setNewTemplate({ ...newTemplate, headerType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-2"
                  >
                    <option value="none">Sem header</option>
                    <option value="text">Texto</option>
                  </select>
                  {newTemplate.headerType === 'text' && (
                    <input
                      type="text"
                      value={newTemplate.headerText}
                      onChange={(e) => setNewTemplate({ ...newTemplate, headerText: e.target.value })}
                      placeholder="Texto do header"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corpo da Mensagem *
                  </label>
                  <textarea
                    value={newTemplate.bodyText}
                    onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                    placeholder="Ex: Olá! Seu pedido {{1}} foi confirmado e será entregue em {{2}}."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {"{{1}}"}, {"{{2}}"}, etc. para variáveis dinâmicas
                  </p>
                </div>

                {/* Footer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer (opcional)
                  </label>
                  <input
                    type="text"
                    value={newTemplate.footerText}
                    onChange={(e) => setNewTemplate({ ...newTemplate, footerText: e.target.value })}
                    placeholder="Ex: Equipe de Vendas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={creating || !newTemplate.name || !newTemplate.bodyText}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Template
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
