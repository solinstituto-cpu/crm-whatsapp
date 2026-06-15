'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Users, 
  Plus, 
  Search, 
  Phone,
  Edit,
  Trash2,
  X,
  MessageSquare,
  Filter,
  ChevronDown,
  Building2,
  MapPin,
  Calendar,
  Upload,
  FileText,
  Download,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  name: string
  phoneE164: string
  email?: string
  company?: string
  role?: string
  notes?: string
  // Dados pessoais
  birthday?: string
  cpf?: string
  address?: string
  city?: string
  state?: string
  // Dados comerciais
  source?: string
  interest?: string
  customerStatus?: string
  enrollmentDate?: string
  referredBy?: string
  // Campos dinâmicos
  customFields?: Record<string, string>
  tags: string[]
  optedOut: boolean
  lastMessageAt: string
  firstContactAt?: string
  lastContactAt?: string
  createdAt: string
  // Atendente responsável
  assignedToId?: string
  assignedTo?: { id: string; name: string; email?: string }
}

export default function ContactsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phoneE164: '',
    email: '',
    company: '',
    role: '',
    notes: '',
    // Dados pessoais
    birthday: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    // Dados comerciais
    source: '',
    interest: '',
    customerStatus: '',
    enrollmentDate: '',
    referredBy: '',
    tags: [] as string[],
    // Campos personalizados (coletados via automação)
    customFields: {} as Record<string, string>,
    // Atendente responsável
    assignedToId: ''
  })
  const [tagInput, setTagInput] = useState('')
  
  // Opções personalizadas (do banco de dados)
  const [statusOptions, setStatusOptions] = useState<{value: string, label: string, color?: string}[]>([])
  const [sourceOptions, setSourceOptions] = useState<{value: string, label: string, color?: string}[]>([])
  const [contactFieldOptions, setContactFieldOptions] = useState<{value: string, label: string}[]>([])
  
  // Opções padrão (fallback)
  const defaultStatusOptions = [
    { value: 'Lead', label: 'Lead' },
    { value: 'Interessado', label: 'Interessado' },
    { value: 'Negociando', label: 'Negociando' },
    { value: 'Cliente', label: 'Cliente' },
    { value: 'Ex-cliente', label: 'Ex-cliente' },
    { value: 'Inativo', label: 'Inativo' }
  ]
  
  const defaultSourceOptions = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Google', label: 'Google' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Indicação', label: 'Indicação' },
    { value: 'Site', label: 'Site' },
    { value: 'Evento', label: 'Evento' },
    { value: 'Outro', label: 'Outro' }
  ]
  
  // Filtros - inicializar do localStorage se disponível
  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contactsFilters')
      if (saved) {
        try { return JSON.parse(saved) } catch { }
      }
    }
    return { customerStatus: '', source: '', interest: '', tag: '', assignedToId: '' }
  })
  const [showFilters, setShowFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contactsFilters')
      if (saved) {
        try {
          const f = JSON.parse(saved)
          return !!(f.customerStatus || f.source || f.interest || f.tag || f.assignedToId)
        } catch { }
      }
    }
    return false
  })
  
  // Persistir filtros no localStorage quando mudam
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contactsFilters', JSON.stringify(filters))
    }
  }, [filters])
  
  // Busca - também persistir
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('contactsSearch') || ''
    }
    return ''
  })
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contactsSearch', searchTerm)
    }
  }, [searchTerm])
  
  // Lista de atendentes
  const [users, setUsers] = useState<{id: string, name: string}[]>([])
  
  // Estatísticas reais do banco
  const [stats, setStats] = useState({ totalGeral: 0, ativos: 0, novos7d: 0 })
  
  // Lista de todas as tags únicas (buscar do backend)
  const [allTags, setAllTags] = useState<string[]>([])
  
  // Importação de contatos
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  
  // Estado para contas WhatsApp (multi-números)
  const [whatsappAccounts, setWhatsappAccounts] = useState<{id: string, name: string, phoneNumber: string, isDefault: boolean}[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crm_selectedAccountId') || ''
    }
    return ''
  })
  
  // Paginação
  const [contactPage, setContactPage] = useState(1)
  const [hasMoreContacts, setHasMoreContacts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false) // Busca/filtro sem trocar a página inteira
  const [totalFiltered, setTotalFiltered] = useState(0)
  const CONTACTS_PER_PAGE = 50
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    const initialize = async () => {
      await fetchWhatsAppAccounts()
      fetchFieldOptions()
      fetchAllTags()
      fetchUsers()
      setInitialLoadDone(true)
    }
    initialize()
  }, [])
  
  // Recarregar quando filtros, busca ou conta selecionada mudar (com debounce)
  useEffect(() => {
    if (!initialLoadDone) return
    const timer = setTimeout(() => {
      fetchContacts(1, false, false) // false = busca/filtro, mantém página visível
    }, 450)
    return () => clearTimeout(timer)
  }, [searchTerm, filters, selectedAccountId, initialLoadDone])
  
  // Persistir conta selecionada
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedAccountId) {
      localStorage.setItem('crm_selectedAccountId', selectedAccountId)
    }
  }, [selectedAccountId])
  
  // Buscar usuários/atendentes
  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.map((u: any) => ({ id: u.id, name: u.name })))
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  // Buscar contas WhatsApp
  const fetchWhatsAppAccounts = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
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

  const fetchContacts = async (page = 1, append = false, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else if (append) {
        setLoadingMore(true)
      } else {
        setLoadingSearch(true) // Busca/filtro: mantém a página visível
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Construir query string com filtros
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', CONTACTS_PER_PAGE.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (filters.customerStatus) params.append('customerStatus', filters.customerStatus)
      if (filters.source) params.append('source', filters.source)
      if (filters.tag) params.append('tag', filters.tag)
      if (filters.interest) params.append('interest', filters.interest)
      if (filters.assignedToId) params.append('assignedToId', filters.assignedToId)
      if (selectedAccountId) params.append('whatsappAccountId', selectedAccountId)
      
      const response = await fetch(`${apiUrl}/api/contacts?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Estatísticas reais do banco
        if (data.stats) {
          setStats(data.stats)
        }
        
        // Total filtrado
        setTotalFiltered(data.pagination?.total || 0)
        
        // Verificar se tem mais páginas
        const pagination = data.pagination
        if (pagination) {
          setHasMoreContacts(page < pagination.pages)
        } else {
          setHasMoreContacts((data.contacts || []).length === CONTACTS_PER_PAGE)
        }
        
        // Parsear customFields de JSON para objeto
        const parsedContacts = (data.contacts || []).map((c: any) => ({
          ...c,
          customFields: c.customFields ? (typeof c.customFields === 'string' ? JSON.parse(c.customFields) : c.customFields) : {}
        }))
        
        if (append) {
          setContacts(prev => [...prev, ...parsedContacts])
        } else {
          setContacts(parsedContacts)
        }
        setContactPage(page)
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setLoadingSearch(false)
      if (isInitialLoad) setInitialLoadDone(true)
    }
  }
  
  // Buscar todas as tags únicas (endpoint leve, sem carregar 5000 contatos)
  const fetchAllTags = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/contacts/tags`)
      if (response.ok) {
        const tags = await response.json()
        setAllTags(Array.isArray(tags) ? tags : [])
      }
    } catch (error) {
      console.error('Erro ao buscar tags:', error)
    }
  }
  
  // Carregar mais contatos
  const loadMoreContacts = () => {
    if (!loadingMore && hasMoreContacts) {
      fetchContacts(contactPage + 1, true)
    }
  }

  const fetchFieldOptions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/settings/field-options`)
      
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const statusOpts = data.filter((opt: any) => opt.fieldType === 'customerStatus')
          const sourceOpts = data.filter((opt: any) => opt.fieldType === 'source')
          const fieldOpts = data.filter((opt: any) => opt.fieldType === 'contactField')
          
          // Usa as opções do banco se existirem, senão usa padrão
          if (statusOpts.length > 0) {
            setStatusOptions(statusOpts.map((opt: any) => ({ value: opt.value, label: opt.label, color: opt.color })))
          } else {
            setStatusOptions(defaultStatusOptions)
          }
          
          if (sourceOpts.length > 0) {
            setSourceOptions(sourceOpts.map((opt: any) => ({ value: opt.value, label: opt.label, color: opt.color })))
          } else {
            setSourceOptions(defaultSourceOptions)
          }
          
          // Campos de contato personalizados
          setContactFieldOptions(fieldOpts.map((opt: any) => ({ value: opt.value, label: opt.label })))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar opções de campo:', error)
      // Em caso de erro, usa as opções padrão
      setStatusOptions(defaultStatusOptions)
      setSourceOptions(defaultSourceOptions)
    }
  }

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact)
      setFormData({
        name: contact.name,
        phoneE164: contact.phoneE164,
        email: contact.email || '',
        company: contact.company || '',
        role: contact.role || '',
        notes: contact.notes || '',
        birthday: contact.birthday ? contact.birthday.split('T')[0] : '',
        cpf: contact.cpf || '',
        address: contact.address || '',
        city: contact.city || '',
        state: contact.state || '',
        source: contact.source || '',
        interest: contact.interest || '',
        customerStatus: contact.customerStatus || '',
        enrollmentDate: contact.enrollmentDate ? contact.enrollmentDate.split('T')[0] : '',
        referredBy: contact.referredBy || '',
        tags: contact.tags || [],
        customFields: contact.customFields || {},
        assignedToId: contact.assignedToId || ''
      })
    } else {
      setEditingContact(null)
      setFormData({
        name: '',
        phoneE164: '',
        email: '',
        company: '',
        role: '',
        notes: '',
        birthday: '',
        cpf: '',
        address: '',
        city: '',
        state: '',
        source: '',
        interest: '',
        customerStatus: '',
        enrollmentDate: '',
        referredBy: '',
        tags: [],
        customFields: {},
        assignedToId: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingContact(null)
    setFormData({ 
      name: '', 
      phoneE164: '', 
      email: '', 
      company: '', 
      role: '', 
      notes: '',
      birthday: '',
      cpf: '',
      address: '',
      city: '',
      state: '',
      source: '',
      interest: '',
      customerStatus: '',
      enrollmentDate: '',
      referredBy: '',
      tags: [],
      customFields: {},
      assignedToId: ''
    })
    setTagInput('')
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      let phone = formData.phoneE164.trim()
      if (!phone.startsWith('+')) {
        phone = '+' + phone.replace(/\D/g, '')
      }
      
      const payload = {
        name: formData.name,
        phoneE164: phone,
        email: formData.email || null,
        company: formData.company || null,
        role: formData.role || null,
        notes: formData.notes || null,
        // Dados pessoais
        birthday: formData.birthday || null,
        cpf: formData.cpf || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        // Dados comerciais
        source: formData.source || null,
        interest: formData.interest || null,
        customerStatus: formData.customerStatus || null,
        enrollmentDate: formData.enrollmentDate || null,
        referredBy: formData.referredBy || null,
        tags: formData.tags,
        // Campos personalizados
        customFields: Object.keys(formData.customFields).length > 0 ? JSON.stringify(formData.customFields) : null,
        // Atendente
        assignedToId: formData.assignedToId || null,
        // Conta do WhatsApp
        whatsappAccountId: selectedAccountId || null
      }
      
      if (editingContact) {
        const response = await fetch(`${apiUrl}/api/contacts/${editingContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (response.ok) {
          fetchContacts()
          handleCloseModal()
        } else {
          const error = await response.json()
          alert(`Erro ao atualizar: ${error.message || 'Tente novamente'}`)
        }
      } else {
        const response = await fetch(`${apiUrl}/api/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (response.ok) {
          fetchContacts()
          handleCloseModal()
        } else {
          const errorText = await response.text()
          if (errorText.includes('Unique constraint') || errorText.includes('phoneE164')) {
            alert('⚠️ Já existe um contato com este número de telefone!')
          } else {
            alert(`Erro ao criar contato: ${errorText}`)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
      alert('Erro ao conectar com o servidor')
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      await fetch(`${apiUrl}/api/contacts/${id}`, { method: 'DELETE' })
      fetchContacts()
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
    }
  }

  const handleOpenChat = async (contact: Contact) => {
    try {
      // Criar ou buscar conversa existente
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/conversations/find-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164: contact.phoneE164 })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar conversa')
      }

      const conversation = await response.json()
      
      // Redirecionar para inbox com a conversa criada/encontrada
      router.push(`/inbox?conversationId=${conversation.id}`)
    } catch (error) {
      console.error('Erro ao abrir chat:', error)
      alert('Erro ao abrir conversa. Tente novamente.')
    }
  }

  // Agora os contatos já vêm filtrados do backend
  // Contagem de filtros ativos
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length + (searchTerm ? 1 : 0)

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
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3 h-8 w-8 text-green-600" />
              Contatos
            </h1>
            <p className="text-gray-600 mt-1">Gerencie seus contatos do WhatsApp</p>
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
              onClick={() => setShowImportModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Contato
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{stats.totalGeral}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Ativos</p>
            <p className="text-2xl font-bold">{stats.ativos}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Novos (7d)</p>
            <p className="text-2xl font-bold">{stats.novos7d}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone, email, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                activeFiltersCount > 0 ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Painel de Filtros */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={filters.customerStatus}
                    onChange={(e) => setFilters({ ...filters, customerStatus: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todos</option>
                    {(statusOptions.length > 0 ? statusOptions : defaultStatusOptions).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                  <select
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas</option>
                    {(sourceOptions.length > 0 ? sourceOptions : defaultSourceOptions).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                  <select
                    value={filters.tag}
                    onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Atendente</label>
                  <select
                    value={filters.assignedToId}
                    onChange={(e) => setFilters({ ...filters, assignedToId: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todos</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Interesse</label>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.interest}
                    onChange={(e) => setFilters({ ...filters, interest: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              {activeFiltersCount > 0 && (
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {totalFiltered} contato(s) encontrado(s)
                  </span>
                  <button
                    onClick={() => {
                      setFilters({ customerStatus: '', source: '', interest: '', tag: '', assignedToId: '' })
                      setSearchTerm('')
                    }}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto relative">
          {loadingSearch && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                <span className="text-sm text-gray-600">Buscando...</span>
              </div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-48 max-w-[200px]">CONTATO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">WHATSAPP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">ATENDENTE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">1º CONTATO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">ÚLT. CONTATO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">TAGS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 w-48 max-w-[200px]">
                    <div className="flex items-center truncate">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-green-800">{contact.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-3 truncate">
                        <div className="text-sm font-medium text-gray-900 truncate">{contact.name}</div>
                        {contact.email && (
                          <div className="text-xs text-gray-500 truncate">{contact.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      {contact.phoneE164}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {contact.assignedTo ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                        {contact.assignedTo.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {contact.firstContactAt ? (
                      <div className="text-xs text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(contact.firstContactAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-gray-500 ml-4">
                          {new Date(contact.firstContactAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {contact.lastContactAt ? (
                      <div className="text-xs text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(contact.lastContactAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-gray-500 ml-4">
                          {new Date(contact.lastContactAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {contact.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                      {contact.tags && contact.tags.length > 2 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => handleOpenChat(contact)}
                        className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                        title="Enviar mensagem"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(contact)}
                        className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Botão carregar mais */}
          <div className="p-4 border-t">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando mais contatos...</span>
              </div>
            )}
            {hasMoreContacts && !loadingMore && (
              <button
                onClick={loadMoreContacts}
                className="w-full py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                Carregar mais ({contacts.length} de {totalFiltered})
              </button>
            )}
            {!hasMoreContacts && totalFiltered > 0 && (
              <p className="text-center text-xs text-gray-400">
                Mostrando {contacts.length} de {totalFiltered} contatos
              </p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingContact ? 'Editar' : 'Novo'} Contato</h2>
              <button onClick={handleCloseModal}><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSaveContact}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneE164}
                      onChange={(e) => setFormData({ ...formData, phoneE164: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="+5511999999999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Empresa</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Cargo</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Cargo/função"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Notas</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                      rows={3}
                      placeholder="Observações sobre o contato..."
                    />
                  </div>
                  
                  {/* Separador - Dados Pessoais */}
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Dados Pessoais</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Endereço</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="São Paulo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      <option value="AC">AC</option>
                      <option value="AL">AL</option>
                      <option value="AP">AP</option>
                      <option value="AM">AM</option>
                      <option value="BA">BA</option>
                      <option value="CE">CE</option>
                      <option value="DF">DF</option>
                      <option value="ES">ES</option>
                      <option value="GO">GO</option>
                      <option value="MA">MA</option>
                      <option value="MT">MT</option>
                      <option value="MS">MS</option>
                      <option value="MG">MG</option>
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PR">PR</option>
                      <option value="PE">PE</option>
                      <option value="PI">PI</option>
                      <option value="RJ">RJ</option>
                      <option value="RN">RN</option>
                      <option value="RS">RS</option>
                      <option value="RO">RO</option>
                      <option value="RR">RR</option>
                      <option value="SC">SC</option>
                      <option value="SP">SP</option>
                      <option value="SE">SE</option>
                      <option value="TO">TO</option>
                    </select>
                  </div>
                  
                  {/* Separador - Dados Comerciais */}
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">💼 Dados Comerciais</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Origem do Lead</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      {(sourceOptions.length > 0 ? sourceOptions : defaultSourceOptions).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Interesse</label>
                    <input
                      type="text"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Curso, produto ou serviço"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.customerStatus}
                      onChange={(e) => setFormData({ ...formData, customerStatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      {(statusOptions.length > 0 ? statusOptions : defaultStatusOptions).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Matrícula</label>
                    <input
                      type="date"
                      value={formData.enrollmentDate}
                      onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Indicado por</label>
                    <input
                      type="text"
                      value={formData.referredBy}
                      onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Nome de quem indicou"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Atendente Responsável</label>
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Nenhum atendente</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="Adicionar tag"
                    />
                    <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-gray-200 rounded-lg">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Campos Personalizados (Coleta de Dados) */}
                {contactFieldOptions.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 Dados Coletados (Automação)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {contactFieldOptions.map((field) => (
                        <div key={field.value}>
                          <label className="block text-sm font-medium text-gray-500 mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={formData.customFields[field.value] || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              customFields: { ...formData.customFields, [field.value]: e.target.value }
                            })}
                            placeholder={`Valor de ${field.label}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Esses campos são preenchidos automaticamente pelos fluxos de automação, mas podem ser editados manualmente.
                    </p>
                  </div>
                )}

                {/* Datas de Contato - Read Only */}
                {editingContact && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Histórico de Contato</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Primeiro Contato</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                          {editingContact.firstContactAt ? (
                            <>
                              {new Date(editingContact.firstContactAt).toLocaleDateString('pt-BR')}
                              {' às '}
                              {new Date(editingContact.firstContactAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </>
                          ) : (
                            <span className="text-gray-400">Não registrado</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Último Contato</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                          {editingContact.lastContactAt ? (
                            <>
                              {new Date(editingContact.lastContactAt).toLocaleDateString('pt-BR')}
                              {' às '}
                              {new Date(editingContact.lastContactAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </>
                          ) : (
                            <span className="text-gray-400">Não registrado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {editingContact ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Upload className="mr-2 h-5 w-5 text-blue-600" />
                Importar Contatos
              </h2>
              <button onClick={() => { setShowImportModal(false); setImportResult(null); setImportData(''); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {!importResult ? (
              <>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">📋 Formato do CSV:</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Cole os dados no formato: <strong>nome;telefone;tags</strong> (uma linha por contato)
                  </p>
                  <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono">
                    <p>João Silva;11999998888;yoga,pilates</p>
                    <p>Maria Santos;11988887777;acupuntura</p>
                    <p>Pedro Lima;21977776666;</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    ✓ Tags são opcionais (separe por vírgula)<br/>
                    ✓ O telefone será formatado automaticamente para +55<br/>
                    ✓ Contatos existentes terão as tags atualizadas
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cole os dados aqui:
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    rows={10}
                    placeholder="João Silva;11999998888;yoga,pilates&#10;Maria Santos;11988887777;acupuntura"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowImportModal(false); setImportData(''); }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!importData.trim()) {
                        alert('Cole os dados dos contatos primeiro');
                        return;
                      }

                      setImporting(true);
                      try {
                        // Parsear dados CSV
                        const lines = importData.trim().split('\n');
                        const contacts = lines.map(line => {
                          const parts = line.split(';');
                          const phone = parts[1]?.trim() || '';
                          return {
                            name: parts[0]?.trim() || phone,
                            phone,
                            tags: parts[2]?.trim() || ''
                          };
                        }).filter(c => c.phone);

                        if (contacts.length === 0) {
                          alert('Nenhum contato válido encontrado');
                          setImporting(false);
                          return;
                        }

                        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
                        const response = await fetch(`${apiUrl}/api/contacts/import`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            whatsappAccountId: selectedAccountId || null,
                            contacts 
                          })
                        });

                        if (response.ok) {
                          const result = await response.json();
                          setImportResult(result);
                          fetchContacts(); // Recarregar lista
                        } else {
                          const error = await response.json();
                          alert(error.message || 'Erro ao importar');
                        }
                      } catch (error) {
                        console.error('Erro:', error);
                        alert('Erro ao importar contatos');
                      } finally {
                        setImporting(false);
                      }
                    }}
                    disabled={importing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar Contatos
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-6xl mb-4">
                    {importResult.failed === 0 ? '✅' : '⚠️'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Importação Concluída!</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-sm text-green-700">Importados com sucesso</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-red-700">Falharam</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg text-left max-h-40 overflow-y-auto">
                    <p className="font-medium text-red-800 mb-2">Erros:</p>
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <p key={idx} className="text-sm text-red-600">{error}</p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-sm text-red-500">...e mais {importResult.errors.length - 10} erros</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setShowImportModal(false); setImportResult(null); setImportData(''); }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
