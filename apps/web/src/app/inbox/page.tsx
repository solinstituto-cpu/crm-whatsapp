'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  MessageSquare,
  Search,
  Phone,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  User,
  Volume2,
  VolumeX,
  Archive,
  Trash2,
  FileText,
  X,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  LogOut,
  UserCheck,
  ArrowRightLeft,
  ChevronDown,
  ArchiveRestore,
  Reply,
  Zap,
  Settings,
  Plus,
  Download,
  Star,
  StarOff,
  Megaphone,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react'

interface MetaTemplate {
  id: string
  name: string
  status: string
  category: string
  language: string
  bodyText: string
  headerFormat: string | null
  requiresMedia: boolean
  components: any[]
}

interface Message {
  id: string
  waMessageId?: string
  content: string
  fromMe: boolean
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'interactive' | 'button' | 'sticker' | 'contacts' | 'location'
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  mediaUrl?: string
  caption?: string
  filename?: string
  buttons?: { id: string; title: string }[]
  replyToMessageId?: string
  replyTo?: {
    id: string
    content: string
    fromMe: boolean
  }
}

interface AssignedUser {
  id: string
  name: string
  email?: string
  color?: string
}

interface Conversation {
  id: string
  contactName: string
  contactPhone: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'open' | 'pending' | 'closed' | 'archived'
  messages: Message[]
  assignedTo?: AssignedUser | null
  assignedToId?: string | null
  assignedAt?: string | null
  contactTags?: string[]
  lastIncomingMessageAt?: string | null // Para janela 24h
}

export default function InboxPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showContactMenu, setShowContactMenu] = useState(false)
  const [attachmentMenu, setAttachmentMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAssignmentAlert, setShowAssignmentAlert] = useState<{show: boolean, assignedTo: string} | null>(null)
  
  // Estados para transferência de conversa
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<{id: string, name: string, email: string, color?: string}[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [transferring, setTransferring] = useState(false)
  
  // Estado para filtro de conversas (ativas, campanhas ou arquivadas)
  const [conversationFilter, setConversationFilter] = useState<'active' | 'campaigns' | 'archived'>('active')
  
  // Referência para área de mensagens (scroll)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  
  // Ref para selectedConversation (para usar no polling)
  const selectedConversationRef = useRef<Conversation | null>(null)
  
  // Estado para responder mensagem específica
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  
  // Respostas rápidas
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [quickReplies, setQuickReplies] = useState<{id: string, title: string, content: string, category?: string, categoryColor?: string}[]>([])
  const [loadingQuickReplies, setLoadingQuickReplies] = useState(false)
  const [quickReplySearch, setQuickReplySearch] = useState('')
  const [quickReplyCategory, setQuickReplyCategory] = useState<string | null>(null)
  const [quickReplyCategories, setQuickReplyCategories] = useState<string[]>([])
  
  // Paginação de conversas
  const [conversationPage, setConversationPage] = useState(1)
  const [hasMoreConversations, setHasMoreConversations] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false) // Busca/filtro sem trocar a página inteira
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const conversationsListRef = useRef<HTMLDivElement>(null)
  const CONVERSATIONS_PER_PAGE = 50
  
  // Filtros avançados do inbox - persistir no localStorage
  const [showInboxFilters, setShowInboxFilters] = useState(false)
  const [inboxFilters, setInboxFilters] = useState<{assignedToId: string, campaignId: string, tag: string, unreadOnly: boolean}>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inboxFilters')
      if (saved) {
        try { return JSON.parse(saved) } catch { }
      }
    }
    return { assignedToId: '', campaignId: '', tag: '', unreadOnly: false }
  })
  
  // Estado para contas WhatsApp (multi-números)
  const [whatsappAccounts, setWhatsappAccounts] = useState<{id: string, name: string, phoneNumber: string, isDefault: boolean}[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [showAccountFilter, setShowAccountFilter] = useState(false)
  
  // Refs para filtros (para usar no polling sem closure stale)
  // Devem ser declarados DEPOIS dos estados que referenciam
  const inboxFiltersRef = useRef(inboxFilters)
  const conversationFilterRef = useRef(conversationFilter)
  const searchTermRef = useRef(searchTerm)
  const selectedAccountIdRef = useRef(selectedAccountId)
  
  // Persistir filtros do inbox
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inboxFilters', JSON.stringify(inboxFilters))
    }
  }, [inboxFilters])
  const [campaigns, setCampaigns] = useState<{id: string, name: string}[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [users, setUsers] = useState<{id: string, name: string, color?: string}[]>([])
  
  // Modal de edição de contato
  const [showContactEditModal, setShowContactEditModal] = useState(false)
  const [editingContactData, setEditingContactData] = useState<any>(null)
  const [contactFormData, setContactFormData] = useState({
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
    tags: [] as string[],
    assignedToId: ''
  })
  const [contactTagInput, setContactTagInput] = useState('')
  const [statusOptions, setStatusOptions] = useState<{value: string, label: string}[]>([])
  const [sourceOptions, setSourceOptions] = useState<{value: string, label: string}[]>([])
  
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
  
  // Função para calcular tempo restante da janela de 24h do WhatsApp
  // REGRAS DO META:
  // - A janela de 24h começa quando o CLIENTE envia uma mensagem
  // - Dentro da janela: pode enviar mensagens de texto livre
  // - Fora da janela: APENAS templates aprovados funcionam
  // - Se o cliente nunca respondeu, a janela está FECHADA (só template funciona)
  const get24hWindowStatus = (lastIncomingMessageAt: string | null | undefined): {
    isOpen: boolean
    hoursRemaining: number
    minutesRemaining: number
    expiresAt: Date | null
    neverReplied: boolean
  } => {
    // Se cliente nunca respondeu, janela está FECHADA
    if (!lastIncomingMessageAt) {
      return { isOpen: false, hoursRemaining: 0, minutesRemaining: 0, expiresAt: null, neverReplied: true }
    }
    
    const lastIncoming = new Date(lastIncomingMessageAt)
    const expiresAt = new Date(lastIncoming.getTime() + 24 * 60 * 60 * 1000) // +24h
    const now = new Date()
    
    if (now >= expiresAt) {
      return { isOpen: false, hoursRemaining: 0, minutesRemaining: 0, expiresAt, neverReplied: false }
    }
    
    const remainingMs = expiresAt.getTime() - now.getTime()
    const hoursRemaining = Math.floor(remainingMs / (60 * 60 * 1000))
    const minutesRemaining = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
    
    return { isOpen: true, hoursRemaining, minutesRemaining, expiresAt, neverReplied: false }
  }
  
  // Função para formatar data da mensagem (mostra dia se não for hoje)
  const formatMessageDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString()
    
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    
    if (isToday) {
      return time
    } else if (isYesterday) {
      return `Ontem ${time}`
    } else {
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`
    }
  }
  
  // Função para mapear mensagem da API para formato do frontend
  const mapMessage = (msg: any): Message => {
    let mediaData: any = null
    try {
      if (msg.json) {
        mediaData = typeof msg.json === 'string' ? JSON.parse(msg.json) : msg.json
      }
    } catch (e) { /* ignore parsing errors */ }
    
    // Extrair botões de mensagens interativas
    const buttons = mediaData?.interactive?.action?.buttons?.map((b: any) => ({
      id: b.reply?.id || b.id,
      title: b.reply?.title || b.title
    })) || mediaData?.buttons || []
    
    // Extrair contexto de reply (quando alguém marca uma mensagem e responde)
    // O WhatsApp envia context.id que é o wamid da mensagem original
    const replyToMsgId = mediaData?.context?.id || mediaData?.replyTo || null
    
    // Tratar conteúdo especial para stickers
    let content = msg.body || mediaData?.caption || mediaData?.interactive?.body?.text || ''
    const msgType = msg.type || 'text'
    
    // Se for sticker, substituir texto genérico por emoji
    if (msgType === 'sticker' || content === 'Sticker received') {
      content = '🎨 Figurinha'
    }
    // Se for vídeo sem caption
    if (content === 'Video received') {
      content = ''
    }
    // Se for áudio sem caption
    if (content === 'Audio message received' || content === 'Voice message received') {
      content = ''
    }
    
    // Extrair URL de mídia de várias fontes possíveis
    // Se for URL relativa do proxy (/api/wa/media/...), converte para URL completa
    const extractMediaUrl = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      const resolveUrl = (url: string | null | undefined): string | null => {
        if (!url) return null
        // Se for URL relativa do proxy, converter para absoluta
        if (url.startsWith('/api/')) {
          return `${apiUrl}${url}`
        }
        return url
      }
      
      // Campo direto adicionado pelo backend
      if (mediaData?.mediaUrl) return resolveUrl(mediaData.mediaUrl)
      // Campo url genérico
      if (mediaData?.url) return resolveUrl(mediaData.url)
      if (mediaData?.link) return resolveUrl(mediaData.link)
      // Dentro do objeto específico do tipo (sticker.url, image.url, etc)
      if (mediaData?.sticker?.url) return resolveUrl(mediaData.sticker.url)
      if (mediaData?.image?.url) return resolveUrl(mediaData.image.url)
      if (mediaData?.video?.url) return resolveUrl(mediaData.video.url)
      if (mediaData?.audio?.url) return resolveUrl(mediaData.audio.url)
      if (mediaData?.document?.url) return resolveUrl(mediaData.document.url)
      // Tentar usar mediaId para construir URL do proxy
      const mediaId = mediaData?.mediaId || mediaData?.audio?.mediaId || mediaData?.video?.mediaId || 
                      mediaData?.image?.mediaId || mediaData?.document?.mediaId || mediaData?.sticker?.mediaId ||
                      mediaData?.audio?.id || mediaData?.video?.id || mediaData?.image?.id || 
                      mediaData?.document?.id || mediaData?.sticker?.id
      if (mediaId) {
        return `${apiUrl}/api/wa/media/${mediaId}`
      }
      return null
    }
    
    return {
      id: msg.id,
      waMessageId: msg.waMessageId, // Para poder relacionar replies
      content: content,
      fromMe: msg.direction === 'OUT',
      timestamp: formatMessageDate(msg.createdAt),
      type: msgType,
      status: msg.status || 'SENT', // Status da mensagem (PENDING, SENT, DELIVERED, READ, FAILED)
      mediaUrl: extractMediaUrl() || undefined,
      caption: mediaData?.caption || null,
      filename: mediaData?.filename || null,
      buttons: buttons.length > 0 ? buttons : undefined,
      replyToMessageId: replyToMsgId
    }
  }

  // Debug - v4 - with real messages
  console.log('🔄 InboxPage rendered, conversations:', conversations?.length ?? 0)
  const [isTyping, setIsTyping] = useState(false)
  
  // Scroll automático para a última mensagem
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])
  
  // Verificar se está no final do scroll
  const handleMessagesScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])
  
  // Scroll para o final quando a conversa é selecionada ou recebe novas mensagens
  useEffect(() => {
    if (selectedConversation) {
      // Scroll imediato e depois com delay para garantir que as mensagens renderizaram
      scrollToBottom(false)
      setTimeout(() => scrollToBottom(false), 50)
      setTimeout(() => scrollToBottom(false), 200)
      setTimeout(() => scrollToBottom(false), 500)
    }
  }, [selectedConversation?.id, scrollToBottom])
  
  // Scroll quando as mensagens carregam
  useEffect(() => {
    if (selectedConversation?.messages?.length) {
      // Sempre rolar para o final quando mensagens são carregadas pela primeira vez
      setTimeout(() => scrollToBottom(false), 100)
    }
  }, [selectedConversation?.messages?.length, selectedConversation?.id, scrollToBottom])
  
  // Template states
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<MetaTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null)
  const [selectedTemplateForMedia, setSelectedTemplateForMedia] = useState<MetaTemplate | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [templateVariables, setTemplateVariables] = useState<string[]>([]) // Valores das variáveis {{1}}, {{2}}, etc.
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<MetaTemplate | null>(null) // Template selecionado para edição

  // Estado para modal de envio de contato
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactToSend, setContactToSend] = useState({ name: '', phone: '' })
  const [sendingContact, setSendingContact] = useState(false)

  // Função para extrair variáveis de um template ({{1}}, {{2}}, etc.)
  const extractTemplateVariables = (bodyText: string): number => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || []
    const uniqueVars = Array.from(new Set(matches))
    return uniqueVars.length
  }

  // Função para formatar a última mensagem baseada no tipo
  const formatLastMessage = (msg: any): string => {
    if (!msg) return 'Sem mensagens'
    
    const type = msg.type?.toLowerCase()
    let body = msg.body || ''
    
    // Limpar textos genéricos do backend
    if (body === 'Sticker received') body = ''
    if (body === 'Video received') body = ''
    if (body === 'Audio message received') body = ''
    if (body === 'Voice message received') body = ''
    if (body === 'Image received') body = ''
    if (body === 'Location shared') body = ''
    if (body === 'Contact card received') body = ''
    
    // Se tem body válido, usa ele (com emoji de tipo se for mídia)
    if (body && body.trim()) {
      if (type === 'image') return `📷 ${body}`
      if (type === 'video') return `🎥 ${body}`
      if (type === 'audio') return `🎵 ${body}`
      if (type === 'document') return `📄 ${body}`
      if (type === 'template') return `📋 ${body}`
      if (type === 'contacts') return `👤 ${body}`
      if (type === 'sticker') return `🎨 ${body}`
      return body
    }
    
    // Se não tem body, mostra só o tipo
    if (type === 'image') return '📷 Imagem'
    if (type === 'video') return '🎥 Vídeo'
    if (type === 'audio') return '🎵 Áudio'
    if (type === 'document') return '📄 Documento'
    if (type === 'template') return '📋 Template'
    if (type === 'contacts') return '👤 Contato'
    if (type === 'sticker') return '🎨 Figurinha'
    if (type === 'location') return '📍 Localização'
    
    return 'Sem mensagens'
  }

  // Função para buscar conversa completa com mensagens
  const fetchConversationDetails = async (conversationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/conversations/${conversationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const conv = await response.json()
        console.log('📥 Conversa completa:', conv)
        
        // Pegar horário da última mensagem (não o updatedAt da conversa)
        const lastMsg = conv.messages?.[conv.messages.length - 1]
        const lastMsgTime = lastMsg?.createdAt 
          ? new Date(lastMsg.createdAt).toLocaleTimeString() 
          : ''
        
        // Mapear para o formato do frontend
        return {
          id: conv.id,
          contactId: conv.contact?.id,
          contactTags: conv.contact?.tags ? JSON.parse(conv.contact.tags) : [],
          contactName: conv.contact?.name || conv.phoneE164 || 'Desconhecido',
          contactPhone: conv.contact?.phoneE164 || conv.phoneE164 || '',
          lastMessage: formatLastMessage(lastMsg),
          lastMessageTime: lastMsgTime,
          unreadCount: 0,
          status: conv.status?.toLowerCase() || 'active',
          assignedTo: conv.assignedTo ? {
            id: conv.assignedTo.id,
            name: conv.assignedTo.name,
            email: conv.assignedTo.email,
            color: conv.assignedTo.color
          } : undefined,
          lastIncomingMessageAt: conv.lastIncomingMessageAt,
          messages: Array.isArray(conv.messages) ? conv.messages.map(mapMessage) : []
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar conversa:', error)
      return null
    }
  }

  // Buscar templates aprovados
  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/templates?status=APPROVED`, {
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.filter((t: MetaTemplate) => t.status === 'APPROVED'))
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Abrir modal de templates
  const handleOpenTemplates = () => {
    setShowTemplateModal(true)
    fetchTemplates()
  }

  // Clique no template - verifica se precisa de mídia ou variáveis
  const handleTemplateClick = (template: MetaTemplate) => {
    const numVariables = extractTemplateVariables(template.bodyText || '')
    const needsEdit = template.requiresMedia || numVariables > 0
    
    if (needsEdit) {
      setSelectedTemplateForEdit(template)
      setSelectedTemplateForMedia(template.requiresMedia ? template : null)
      setTemplateVariables(new Array(numVariables).fill(''))
      setMediaUrl('')
      setSelectedFile(null)
    } else {
      handleSendTemplate(template, null, [])
    }
  }

  // Upload de arquivo para a API do Meta
  const handleFileUploadForTemplate = async (file: File): Promise<string | null> => {
    setUploadingImage(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
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
      alert('Erro ao fazer upload da imagem')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  // Enviar template com arquivo anexado
  const handleSendTemplateWithFile = async () => {
    if (!selectedTemplateForEdit || !selectedConversation) return
    
    if (selectedFile) {
      // Upload do arquivo primeiro
      const mediaId = await handleFileUploadForTemplate(selectedFile)
      if (mediaId) {
        await handleSendTemplateWithMediaId(selectedTemplateForEdit, mediaId, templateVariables)
      }
    } else if (mediaUrl) {
      // Usar URL diretamente
      await handleSendTemplate(selectedTemplateForEdit, mediaUrl, templateVariables)
    } else if (!selectedTemplateForEdit.requiresMedia) {
      // Template sem mídia, só com variáveis
      await handleSendTemplate(selectedTemplateForEdit, null, templateVariables)
    }
  }

  // Enviar template com media ID (arquivo já upado)
  const handleSendTemplateWithMediaId = async (template: MetaTemplate, mediaId: string, variables: string[] = []) => {
    if (!selectedConversation) return
    
    setSendingTemplate(template.id)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Determinar tipo de mídia baseado no headerFormat
      const mediaType = template.headerFormat?.toLowerCase() || 'image'
      
      // Components com media ID
      const components: any[] = [{
        type: 'header',
        parameters: [{
          type: mediaType,
          [mediaType]: { id: mediaId }
        }]
      }]
      
      // Adicionar variáveis do body se houver
      if (variables.length > 0 && variables.some(v => v.trim())) {
        components.push({
          type: 'body',
          parameters: variables.filter(v => v.trim()).map(v => ({ type: 'text', text: v }))
        })
      }
      
      // Substituir variáveis no texto para salvar no banco
      let displayText = template.bodyText || `Template: ${template.name}`
      variables.forEach((value, index) => {
        displayText = displayText.replace(`{{${index + 1}}}`, value || `{{${index + 1}}}`)
      })
      
      const response = await fetch(`${apiUrl}/api/wa/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.contactPhone,
          templateName: template.name,
          language: template.language || 'pt_BR',
          bodyText: displayText,
          components
        })
      })
      
      if (response.ok) {
        const newMsg: Message = {
          id: `template-${Date.now()}`,
          content: displayText,
          fromMe: true,
          timestamp: new Date().toLocaleTimeString(),
          type: 'template'
        }
        
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg]
        } : null)
        
        setShowTemplateModal(false)
        setSelectedTemplateForMedia(null)
        setSelectedTemplateForEdit(null)
        setTemplateVariables([])
        setMediaUrl('')
        setSelectedFile(null)
        
        // Marcar como lida agora que respondeu
        markConversationAsRead(selectedConversation.id.toString())
        
        setTimeout(() => fetchConversationsBackground(), 1000)
      } else {
        const error = await response.json()
        alert(`Erro ao enviar template: ${error.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao enviar template:', error)
      alert('Erro ao enviar template')
    } finally {
      setSendingTemplate(null)
    }
  }

  // Enviar template para contato
  const handleSendTemplate = async (template: MetaTemplate, imageUrl: string | null, variables: string[] = []) => {
    if (!selectedConversation) return
    
    setSendingTemplate(template.id)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Determinar tipo de mídia baseado no headerFormat
      const mediaType = template.headerFormat?.toLowerCase() || 'image'
      
      // Montar components com mídia se necessário
      const components: any[] = []
      if (template.requiresMedia && imageUrl) {
        components.push({
          type: 'header',
          parameters: [{
            type: mediaType,
            [mediaType]: { link: imageUrl }
          }]
        })
      }
      
      // Adicionar variáveis do body se houver
      if (variables.length > 0 && variables.some(v => v.trim())) {
        components.push({
          type: 'body',
          parameters: variables.filter(v => v.trim()).map(v => ({ type: 'text', text: v }))
        })
      }
      
      // Substituir variáveis no texto para exibição local
      let displayText = template.bodyText || `Template: ${template.name}`
      variables.forEach((value, index) => {
        displayText = displayText.replace(`{{${index + 1}}}`, value || `{{${index + 1}}}`)
      })
      
      const response = await fetch(`${apiUrl}/api/wa/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.contactPhone,
          templateName: template.name,
          language: template.language || 'pt_BR',
          bodyText: displayText,
          components: components.length > 0 ? components : undefined
        })
      })
      
      if (response.ok) {
        // Adicionar mensagem localmente
        const newMsg: Message = {
          id: `template-${Date.now()}`,
          content: displayText,
          fromMe: true,
          timestamp: new Date().toLocaleTimeString(),
          type: 'template'
        }
        
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg]
        } : null)
        
        setShowTemplateModal(false)
        setSelectedTemplateForMedia(null)
        setSelectedTemplateForEdit(null)
        setTemplateVariables([])
        setMediaUrl('')
        
        // Marcar como lida agora que respondeu
        markConversationAsRead(selectedConversation.id.toString())
        
        // Atualizar conversa do servidor
        setTimeout(() => fetchConversationsBackground(), 1000)
      } else {
        const error = await response.json()
        alert(`Erro ao enviar template: ${error.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao enviar template:', error)
      alert('Erro ao enviar template')
    } finally {
      setSendingTemplate(null)
    }
  }

  // Marcar mensagens como lidas
  const markConversationAsRead = async (conversationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      await fetch(`${apiUrl}/api/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      // Zerar contador local
      setConversations(prev => prev.map(c => 
        c.id.toString() === conversationId ? { ...c, unreadCount: 0 } : c
      ))
      // Resetar título da página
      document.title = 'DRM CRM'
    } catch (error) {
      console.error('Erro ao marcar como lido:', error)
    }
  }

  // Função para atribuir atendente à conversa
  const assignConversationToUser = async (conversationId: string) => {
    if (!session?.user) return { success: false }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session.user as any).id || session.user.email,
          userName: session.user.name || session.user.email,
        }),
      })
      
      if (response.ok) {
        return await response.json()
      }
      return { success: false }
    } catch (error) {
      console.error('Erro ao atribuir conversa:', error)
      return { success: false }
    }
  }

  // Handler para selecionar conversa e buscar mensagens
  const handleSelectConversation = async (conversation: Conversation) => {
    // Encontrar conversa atual com mensagens locais
    const currentConv = conversations.find(c => c.id === conversation.id)
    const localMessages = currentConv?.messages || conversation.messages || []
    
    // Buscar cor do usuário atribuído
    const getAssignedToWithColor = (assignedTo: any) => {
      if (!assignedTo) return undefined
      const user = users.find(u => u.id === assignedTo.id)
      return {
        ...assignedTo,
        color: assignedTo.color || user?.color || '#3B82F6'
      }
    }
    
    // Mostrar imediatamente com mensagens locais e preservar unreadCount
    setSelectedConversation({ 
      ...conversation, 
      messages: localMessages, 
      unreadCount: conversation.unreadCount,
      assignedTo: getAssignedToWithColor(conversation.assignedTo)
    })
    
    // Buscar detalhes completos da API
    const fullConversation = await fetchConversationDetails(conversation.id.toString())
    if (fullConversation) {
      // Mesclar: usar mensagens da API se existirem, senão manter locais
      const apiMessages = fullConversation.messages || []
      const mergedMessages = apiMessages.length > 0 ? apiMessages : localMessages
      
      // Preservar lastMessageTime original da conversa
      const assignedToWithColor = getAssignedToWithColor(fullConversation.assignedTo)
      const updatedConv = { 
        ...fullConversation, 
        messages: mergedMessages, 
        unreadCount: conversation.unreadCount,
        lastMessageTime: conversation.lastMessageTime, // Manter horário original
        assignedTo: assignedToWithColor
      }
      setSelectedConversation(updatedConv)
      
      // Atualizar na lista
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? { ...c, unreadCount: conversation.unreadCount, assignedTo: assignedToWithColor } : c
      ))
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  // Manter ref sincronizada com selectedConversation
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  // Manter refs de filtros sincronizadas (para polling)
  useEffect(() => {
    inboxFiltersRef.current = inboxFilters
  }, [inboxFilters])
  
  useEffect(() => {
    conversationFilterRef.current = conversationFilter
  }, [conversationFilter])
  
  useEffect(() => {
    searchTermRef.current = searchTerm
  }, [searchTerm])
  
  useEffect(() => {
    selectedAccountIdRef.current = selectedAccountId
  }, [selectedAccountId])

  useEffect(() => {
    fetchConversations(1, false, true) // Carga inicial: isInitialLoad=true
    fetchInboxFiltersData()
    fetchWhatsAppAccounts()
    
    // Polling: atualizar conversas a cada 5 segundos
    const interval = setInterval(() => {
      fetchConversationsBackground()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Recarregar quando filtros de inbox mudarem (após carga inicial)
  useEffect(() => {
    if (!initialLoadDone) return
    // Debounce para busca de texto
    const timer = setTimeout(() => {
      fetchConversations(1, false, false) // false = busca/filtro, mantém página visível
    }, searchTerm ? 450 : 0)
    return () => clearTimeout(timer)
  }, [inboxFilters.unreadOnly, inboxFilters.assignedToId, conversationFilter, searchTerm, selectedAccountId, initialLoadDone])
  
  // Buscar contas WhatsApp (multi-números) - filtradas pelo usuário logado
  const fetchWhatsAppAccounts = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    const userId = (session?.user as any)?.id
    try {
      // Passa userId para filtrar contas que o usuário pode acessar
      const url = userId 
        ? `${apiUrl}/api/whatsapp-accounts?userId=${userId}`
        : `${apiUrl}/api/whatsapp-accounts`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setWhatsappAccounts(data.map((a: any) => ({
          id: a.id,
          name: a.name,
          phoneNumber: a.phoneNumber || '',
          isDefault: a.isDefault
        })))
      }
    } catch (error) {
      console.error('Erro ao buscar contas WhatsApp:', error)
    }
  }
  
  // Recarregar conversas quando mudar a conta selecionada
  useEffect(() => {
    // Não recarrega na primeira renderização (loading já é true)
    if (!loading && initialLoadDone) {
      setConversationPage(1)
      fetchConversations(1, false, false) // Filtro de conta: mantém página visível
      setSelectedConversation(null) // Limpar conversa selecionada
    }
  }, [selectedAccountId, loading, initialLoadDone])
  
  // Buscar dados para os filtros (campanhas, tags, usuários)
  const fetchInboxFiltersData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    
    // Buscar campanhas
    try {
      const campRes = await fetch(`${apiUrl}/api/campaigns`)
      if (campRes.ok) {
        const data = await campRes.json()
        setCampaigns((data.campaigns || data || []).map((c: any) => ({ id: c.id, name: c.name })))
      }
    } catch (e) { console.error('Erro ao buscar campanhas:', e) }
    
    // Buscar usuários/atendentes
    try {
      const usersRes = await fetch(`${apiUrl}/api/users`)
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.map((u: any) => ({ id: u.id, name: u.name, color: u.color })))
      }
    } catch (e) { console.error('Erro ao buscar usuários:', e) }
    
    // Buscar tags únicas dos contatos
    try {
      const tagsRes = await fetch(`${apiUrl}/api/contacts?limit=5000`)
      if (tagsRes.ok) {
        const data = await tagsRes.json()
        const tags = new Set<string>()
        ;(data.contacts || []).forEach((c: any) => {
          const contactTags = Array.isArray(c.tags) ? c.tags : []
          contactTags.forEach((t: string) => tags.add(t))
        })
        setAllTags(Array.from(tags).sort())
      }
    } catch (e) { console.error('Erro ao buscar tags:', e) }
  }

  // Verificar query param para abrir conversa específica
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const phone = params.get('phone')
      const conversationId = params.get('conversationId')
      
      // Priorizar conversationId se fornecido
      if (conversationId) {
        // Buscar conversa completa pelo ID
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        fetch(`${apiUrl}/api/conversations/${conversationId}`)
          .then(res => res.json())
          .then(conv => {
            const lastMsg = conv.messages?.[conv.messages.length - 1]
            const formattedConv = {
              id: conv.id,
              contactName: conv.contact?.name || conv.phoneE164 || 'Desconhecido',
              contactPhone: conv.contact?.phoneE164 || conv.phoneE164 || '',
              lastMessage: formatLastMessage(lastMsg),
              lastMessageTime: lastMsg?.createdAt ? formatMessageDate(lastMsg.createdAt) : '',
              unreadCount: 0,
              status: conv.status?.toLowerCase() || 'active',
              assignedTo: conv.assignedTo ? {
                id: conv.assignedTo.id,
                name: conv.assignedTo.name,
                email: conv.assignedTo.email,
                color: conv.assignedTo.color
              } : undefined,
              lastIncomingMessageAt: conv.lastIncomingMessageAt,
              messages: Array.isArray(conv.messages) ? conv.messages.map(mapMessage) : []
            }
            handleSelectConversation(formattedConv)
            // Limpar query param
            window.history.replaceState({}, '', '/inbox')
          })
          .catch(err => console.error('Erro ao buscar conversa:', err))
      } else if (phone && conversations.length > 0) {
        const conversation = conversations.find(c => c.contactPhone === phone)
        if (conversation) {
          handleSelectConversation(conversation)
          // Limpar query param
          window.history.replaceState({}, '', '/inbox')
        }
      }
    }
  }, [conversations])

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQsUcqT/1bdYFBdwr+vtjVYNE12k3NR9UQoNVJDFt3Y9BwtAhLmvcT8DAh0wPjYvHQAFCBQYFBEFAAYXNkttdF1GJRAFECdFZoqXhWM8EgILI0dsj5+EWikGABlTjri1dSwACDCEzNySPwACG1qg8/GVQgABDj2CwOOjWgACBx5OgK/Rq2kNAAscWpnR36ZmCgALJ2iWxdWdVQAAED+AueykYAACByBPgbDRr20AAA0oaJ7d5pZIAAASPnu/8rBdAAAGGEmAtNm2bAAADSlvpuHqmEQAABU/e7rws18AAAcbTYO627hvAAAOKW+k4OqYQwAAEjt3svGzYQAABxtNg7rauG0AAAwma6Li6JVCAAAQOHW28bRhAAAHHE+GvN27bQAADShtpensmEEAABI8eLXytWAA')
      audio.volume = 0.5
      audio.play()
    } catch (e) {
      console.log('Som não suportado')
    }
  }

  // Busca em background - usa os mesmos filtros para manter consistência
  const fetchConversationsBackground = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Usar refs para pegar valores atuais (evita closure stale)
      const currentFilters = inboxFiltersRef.current
      const currentConversationFilter = conversationFilterRef.current
      const currentSearchTerm = searchTermRef.current
      const currentAccountId = selectedAccountIdRef.current
      
      // Usar os mesmos filtros da busca principal
      const params = new URLSearchParams({
        page: '1',
        limit: String(CONVERSATIONS_PER_PAGE)
      })
      if (currentAccountId) {
        params.append('accountId', currentAccountId)
      }
      if (currentFilters.unreadOnly) {
        params.append('unreadOnly', 'true')
      }
      if (currentFilters.assignedToId) {
        params.append('assignedToId', currentFilters.assignedToId)
      }
      if (currentSearchTerm) {
        params.append('search', currentSearchTerm)
      }
      if (currentConversationFilter === 'archived') {
        params.append('status', 'ARCHIVED')
      } else if (currentConversationFilter === 'campaigns') {
        params.append('status', 'OPEN')
        params.append('hasTags', 'true')
      } else {
        params.append('status', 'OPEN')
        params.append('hasTags', 'false')
      }
      
      console.log('🔄 Polling com filtros:', { 
        unreadOnly: currentFilters.unreadOnly, 
        assignedToId: currentFilters.assignedToId,
        search: currentSearchTerm,
        archived: currentConversationFilter === 'archived'
      })
      
      const response = await fetch(`${apiUrl}/api/conversations?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        const conversationsList = Array.isArray(data.conversations) ? data.conversations : []
        
        const formattedFirstPage = conversationsList.map((conv: any) => {
          const lastMsg = conv.messages?.[0]
          let contactTags: string[] = []
          if (conv.contact?.tags) {
            try {
              contactTags = typeof conv.contact.tags === 'string' 
                ? JSON.parse(conv.contact.tags) 
                : conv.contact.tags
            } catch { contactTags = [] }
          }
          return {
            id: conv.id,
            contactName: conv.contact?.name || conv.phoneE164 || 'Desconhecido',
            contactPhone: conv.contact?.phoneE164 || conv.phoneE164 || '',
            lastMessage: formatLastMessage(lastMsg),
            lastMessageTime: lastMsg?.createdAt ? formatMessageDate(lastMsg.createdAt) : '',
            unreadCount: conv.unreadCount || 0,
            status: conv.status?.toLowerCase() || 'active',
            assignedTo: conv.assignedTo ? {
              id: conv.assignedTo.id,
              name: conv.assignedTo.name,
              email: conv.assignedTo.email,
              color: conv.assignedTo.color
            } : undefined,
            assignedToId: conv.assignedToId || null,
            contactTags,
            lastIncomingMessageAt: conv.lastIncomingMessageAt,
            messages: Array.isArray(conv.messages) ? conv.messages.map(mapMessage) : []
          }
        })
        
        // Verificar se tem novas mensagens comparando com primeira conversa
        const firstNewMsg = formattedFirstPage[0]?.messages[0]?.id
        const firstOldMsg = conversations[0]?.messages[0]?.id
        
        if (firstNewMsg && firstNewMsg !== firstOldMsg && conversations.length > 0) {
          playNotificationSound()
          document.title = `Nova mensagem - DRM CRM`
        }
        
        // Se tem filtros ativos, substituir completamente (não mesclar)
        // Se não tem filtros, mesclar para manter paginação
        const hasActiveFilters = currentFilters.unreadOnly || currentFilters.assignedToId || currentSearchTerm || currentConversationFilter === 'archived'
        
        if (hasActiveFilters) {
          // Com filtros: substituir completamente
          setConversations(formattedFirstPage)
        } else {
          // Sem filtros: mesclar para manter paginação
          setConversations(prev => {
            const existingIds = new Set(formattedFirstPage.map((c: any) => c.id))
            const remaining = prev.filter(c => !existingIds.has(c.id))
            return [...formattedFirstPage, ...remaining]
          })
        }
        
        // Atualizar conversa selecionada sempre que houver atualizações (usando ref)
        const currentSelectedConv = selectedConversationRef.current
        if (currentSelectedConv) {
          const updatedConversationSummary = formattedFirstPage.find((c: any) => c.id === currentSelectedConv.id)
          if (updatedConversationSummary) {
            // Comparar quantidade de mensagens (a lista só tem 1, mas podemos detectar se houve mudança pelo ID)
            const lastMsgIdInList = updatedConversationSummary.messages[0]?.id
            const lastMsgIdInSelected = currentSelectedConv.messages[currentSelectedConv.messages.length - 1]?.id
            
            // Se a última mensagem da lista é diferente da última na conversa selecionada, buscar conversa completa
            if (lastMsgIdInList && lastMsgIdInList !== lastMsgIdInSelected) {
              console.log('🔄 Nova mensagem detectada, buscando conversa completa...')
              
              // Buscar conversa completa com todas as mensagens
              const convResponse = await fetch(`${apiUrl}/api/conversations/${currentSelectedConv.id}`)
              if (convResponse.ok) {
                const fullConv = await convResponse.json()
                const formattedFullConv = {
                  ...updatedConversationSummary,
                  messages: Array.isArray(fullConv.messages) ? fullConv.messages.map(mapMessage) : []
                }
                console.log('✅ Conversa atualizada com', formattedFullConv.messages.length, 'mensagens')
                setSelectedConversation(formattedFullConv)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro no polling:', error)
    }
  }

  const fetchConversations = async (page = 1, append = false, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else if (append) {
        setLoadingMore(true)
      } else {
        setLoadingSearch(true) // Busca/filtro: mantém a página visível
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Buscar conversas com paginação, filtro de conta e filtros de inbox
      const params = new URLSearchParams({
        page: String(page),
        limit: String(CONVERSATIONS_PER_PAGE)
      })
      if (selectedAccountId) {
        params.append('accountId', selectedAccountId)
      }
      // Adicionar filtros de inbox (busca no backend)
      if (inboxFilters.unreadOnly) {
        params.append('unreadOnly', 'true')
      }
      if (inboxFilters.assignedToId) {
        params.append('assignedToId', inboxFilters.assignedToId)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      // Filtro de status (ativas vs arquivadas vs campanhas)
      if (conversationFilter === 'archived') {
        params.append('status', 'ARCHIVED')
      } else if (conversationFilter === 'campaigns') {
        params.append('status', 'OPEN')
        params.append('hasTags', 'true')
      } else {
        params.append('status', 'OPEN')
        params.append('hasTags', 'false')
      }
      
      const response = await fetch(`${apiUrl}/api/conversations?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📥 API Response:', data)
        
        // A API retorna { conversations: [...], pagination: {...} }
        const conversationsList = Array.isArray(data.conversations) 
          ? data.conversations 
          : Array.isArray(data) 
            ? data 
            : []
        
        // Verificar se tem mais páginas
        const pagination = data.pagination
        if (pagination) {
          setHasMoreConversations(page < pagination.pages)
        } else {
          setHasMoreConversations(conversationsList.length === CONVERSATIONS_PER_PAGE)
        }
        
        // Mapear para o formato esperado pelo frontend
        const formattedConversations = conversationsList.map((conv: any) => {
          const lastMsg = conv.messages?.[0] // messages já vem ordenado por desc
          // Parse tags do contato
          let contactTags: string[] = []
          if (conv.contact?.tags) {
            try {
              contactTags = typeof conv.contact.tags === 'string' 
                ? JSON.parse(conv.contact.tags) 
                : conv.contact.tags
            } catch { contactTags = [] }
          }
          return {
            id: conv.id,
            contactName: conv.contact?.name || conv.phoneE164 || 'Desconhecido',
            contactPhone: conv.contact?.phoneE164 || conv.phoneE164 || '',
            lastMessage: formatLastMessage(lastMsg),
            lastMessageTime: lastMsg?.createdAt ? formatMessageDate(lastMsg.createdAt) : '',
            unreadCount: conv.unreadCount || 0,
            status: conv.status?.toLowerCase() || 'active',
            assignedTo: conv.assignedTo ? {
              id: conv.assignedTo.id,
              name: conv.assignedTo.name,
              email: conv.assignedTo.email,
              color: conv.assignedTo.color
            } : undefined,
            assignedToId: conv.assignedToId || null,
            contactTags,
            lastIncomingMessageAt: conv.lastIncomingMessageAt,
            messages: Array.isArray(conv.messages) ? conv.messages.map(mapMessage) : []
          }
        })
        
        if (append) {
          setConversations(prev => [...prev, ...formattedConversations])
        } else {
          setConversations(formattedConversations)
        }
        setConversationPage(page)
        console.log('📋 Formatted conversations:', formattedConversations)
      } else {
        console.error('❌ Erro ao buscar conversas:', response.status)
        if (!append) setConversations([])
      }
    } catch (error) {
      console.error('Erro ao conectar com a API:', error)
      if (!append) setConversations([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setLoadingSearch(false)
      if (isInitialLoad) setInitialLoadDone(true)
    }
  }
  
  // Carregar mais conversas
  const loadMoreConversations = () => {
    if (!loadingMore && hasMoreConversations) {
      fetchConversations(conversationPage + 1, true)
    }
  }
  
  // Detectar scroll para carregar mais
  const handleConversationsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    
    // Carregar mais quando estiver a 100px do final
    if (scrollBottom < 100 && hasMoreConversations && !loadingMore) {
      loadMoreConversations()
    }
  }, [hasMoreConversations, loadingMore, conversationPage])

  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter(conversation => {
        // Filtro de tag ainda é local (não implementado no backend)
        const matchesTag = !inboxFilters.tag || 
          (conversation.contactTags && conversation.contactTags.includes(inboxFilters.tag))
        
        return matchesTag
      }).sort((a, b) => {
        const getSlaPriority = (conv: any) => {
          if (conv.unreadCount > 0) {
            const incomingTime = conv.lastIncomingMessageAt || conv.updatedAt || new Date().toISOString()
            const waitTimeMs = new Date().getTime() - new Date(incomingTime).getTime()
            const waitTimeHours = waitTimeMs / (1000 * 60 * 60)
            
            if (waitTimeHours > 4) return 3 // Vermelho
            if (waitTimeHours > 2) return 2 // Amarelo
            return 1 // Verde
          }
          return 4 // Outros
        }
        
        const priorityA = getSlaPriority(a)
        const priorityB = getSlaPriority(b)
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }
        
        // Em ordem de horários (mais recente primeiro)
        const timeA = new Date(a.lastMessageAt || a.updatedAt || 0).getTime()
        const timeB = new Date(b.lastMessageAt || b.updatedAt || 0).getTime()
        return timeB - timeA
      })
    : []
  
  // Buscar respostas rápidas
  const fetchQuickReplies = async () => {
    setLoadingQuickReplies(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/quick-replies/categories`, {
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const categories = await response.json()
        // Flatten: transformar em lista com categorias
        const allReplies: {id: string, title: string, content: string, category?: string, categoryColor?: string}[] = []
        const categoryNames: string[] = []
        
        categories.forEach((cat: any) => {
          categoryNames.push(cat.name)
          cat.quickReplies?.forEach((reply: any) => {
            allReplies.push({
              id: reply.id,
              title: reply.name,
              content: reply.content,
              category: cat.name,
              categoryColor: cat.color
            })
          })
        })
        setQuickReplies(allReplies)
        setQuickReplyCategories(categoryNames)
      }
    } catch (error) {
      console.error('Erro ao buscar respostas rápidas:', error)
    } finally {
      setLoadingQuickReplies(false)
    }
  }
  
  // Abrir menu de respostas rápidas
  const handleOpenQuickReplies = () => {
    setShowQuickReplies(true)
    setQuickReplySearch('')
    setQuickReplyCategory(null)
    fetchQuickReplies()
  }
  
  // Selecionar resposta rápida
  const handleSelectQuickReply = (content: string) => {
    setNewMessage(content)
    setShowQuickReplies(false)
    setQuickReplySearch('')
    setQuickReplyCategory(null)
  }
  
  // Filtrar respostas rápidas e ordenar alfabeticamente
  const filteredQuickReplies = quickReplies
    .filter(reply => {
      const matchesSearch = !quickReplySearch || 
        reply.title.toLowerCase().includes(quickReplySearch.toLowerCase()) ||
        reply.content.toLowerCase().includes(quickReplySearch.toLowerCase())
      const matchesCategory = !quickReplyCategory || reply.category === quickReplyCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  
  // Arquivar/Desarquivar conversa
  const handleArchiveConversation = async (conversationId: string, archive: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/conversations/${conversationId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: archive })
      })
      
      if (response.ok) {
        // Atualizar localmente
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status: archive ? 'archived' : 'open' }
            : conv
        ))
        
        if (selectedConversation?.id === conversationId) {
          if (archive) {
            setSelectedConversation(null)
          } else {
            setSelectedConversation(prev => prev ? { ...prev, status: 'open' } : null)
          }
        }
        
        alert(archive ? '✅ Conversa arquivada' : '✅ Conversa desarquivada')
      }
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error)
      // Fallback: atualizar apenas localmente
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, status: archive ? 'archived' : 'open' }
          : conv
      ))
      if (selectedConversation?.id === conversationId && archive) {
        setSelectedConversation(null)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    // Verificar janela de 24h
    const windowStatus = get24hWindowStatus(selectedConversation.lastIncomingMessageAt)
    if (!windowStatus.isOpen) {
      if (windowStatus.neverReplied) {
        alert('⚠️ O cliente ainda não respondeu!\n\nPara iniciar uma conversa no WhatsApp Business, você precisa enviar um Template aprovado pelo Meta.\n\nClique no botão 📄 (documento) para selecionar um template.')
      } else {
        alert('⚠️ A janela de 24 horas expirou!\n\nFaz mais de 24h desde a última mensagem do cliente.\nVocê só pode enviar Templates aprovados pelo Meta.\n\nClique no botão 📄 (documento) para enviar um template.')
      }
      return
    }

    const messageContent = newMessage
    setNewMessage('') // Limpar input imediatamente
    
    // Capturar replyTo antes de limpar
    const currentReplyTo = replyingTo
    setReplyingTo(null)

    const message: Message = {
      id: String(Date.now()),
      content: messageContent,
      fromMe: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      replyTo: currentReplyTo ? {
        id: currentReplyTo.id,
        content: currentReplyTo.content,
        fromMe: currentReplyTo.fromMe
      } : undefined,
      replyToMessageId: currentReplyTo?.waMessageId || currentReplyTo?.id
    }

    // Atualizar conversa localmente (otimistic update) e zerar unreadCount
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: messageContent,
      lastMessageTime: 'Agora',
      unreadCount: 0
    }
    
    setSelectedConversation(updatedConversation)
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id ? updatedConversation : conv
    ))

    // Enviar mensagem pela API do backend (que salva no banco e envia para WhatsApp)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Usar o endpoint público do backend - enviar context com waMessageId para quote no WhatsApp
      const response = await fetch(`${apiUrl}/api/wa/send-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: selectedConversation.contactPhone,
          text: messageContent,
          type: 'text',
          // Enviar context para o WhatsApp fazer o quote da mensagem
          context: currentReplyTo?.waMessageId ? { message_id: currentReplyTo.waMessageId } : undefined,
          userId: (session?.user as any)?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Mensagem enviada:', data)
        
        // Marcar como lida agora que respondeu
        markConversationAsRead(selectedConversation.id.toString())
      } else {
        const errorData = await response.json()
        console.error('❌ Erro ao enviar mensagem:', errorData)
        alert(`Erro ao enviar: ${errorData.message || 'Falha no envio'}`)
      }
    } catch (error) {
      console.error('❌ Erro de conexão:', error)
      alert('Erro ao enviar mensagem. Verifique sua conexão.')
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa? Todas as mensagens serão apagadas permanentemente.')) {
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remover da lista de conversas
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        
        // Limpar seleção se era a conversa ativa
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null)
        }
        
        console.log('✅ Conversa excluída com sucesso')
      } else {
        const error = await response.json()
        alert(`Erro ao excluir: ${error.message || 'Tente novamente'}`)
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error)
      alert('Erro ao excluir conversa. Tente novamente.')
    }
  }

  const handleAttachFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAttachmentMenu(!attachmentMenu)
    setShowEmojiPicker(false) // Fechar emoji picker se estiver aberto
  }

  const handleEmojiPicker = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEmojiPicker(!showEmojiPicker)
    setAttachmentMenu(false) // Fechar menu de anexos se estiver aberto
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Função para inserir emoji na posição do cursor
  const insertEmojiAtCursor = (emoji: string) => {
    const input = document.querySelector('input[placeholder="Digite sua mensagem..."]') as HTMLInputElement
    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newText = newMessage.substring(0, start) + emoji + newMessage.substring(end)
      setNewMessage(newText)
      
      // Reposicionar cursor após inserir emoji
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setNewMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const handleFileUpload = async (type: string) => {
    setAttachmentMenu(false)
    
    if (!selectedConversation) {
      alert('Selecione uma conversa primeiro')
      return
    }
    
    // Criar input de arquivo oculto
    const input = document.createElement('input')
    input.type = 'file'
    
    switch(type) {
      case 'image':
        input.accept = 'image/jpeg,image/png,image/webp'
        input.multiple = false
        break
      case 'video':
        input.accept = 'video/mp4,video/3gpp'
        input.multiple = false
        break
      case 'document':
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt'
        break
      case 'audio':
        input.accept = 'audio/aac,audio/mp4,audio/mpeg,audio/amr,audio/ogg'
        break
    }
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return
      
      const file = files[0]
      console.log(`Uploading ${file.name} (${type})`)
      
      // Validar tamanho do arquivo
      const maxSizes: Record<string, number> = {
        image: 5 * 1024 * 1024,    // 5MB para imagens
        video: 16 * 1024 * 1024,   // 16MB para vídeos
        audio: 16 * 1024 * 1024,   // 16MB para áudio
        document: 100 * 1024 * 1024 // 100MB para documentos
      }
      
      if (file.size > (maxSizes[type] || 16 * 1024 * 1024)) {
        alert(`❌ Arquivo muito grande. Máximo: ${(maxSizes[type] / (1024 * 1024)).toFixed(0)}MB`)
        return
      }
      
      // Determinar emoji baseado no tipo
      let fileEmoji = '📎'
      if (type === 'image') fileEmoji = '📷'
      else if (type === 'video') fileEmoji = '🎥'
      else if (type === 'document') fileEmoji = '📄'
      else if (type === 'audio') fileEmoji = '🎵'
      
      // Mensagem temporária de "enviando"
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: `${fileEmoji} Enviando ${file.name}...`,
        fromMe: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: type === 'image' ? 'image' : type === 'video' ? 'video' : type === 'audio' ? 'audio' : 'document'
      }
      
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, tempMessage]
      } : null)
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        
        // 1. Fazer upload do arquivo para obter o media_id
        const formData = new FormData()
        formData.append('file', file)
        
        const uploadResponse = await fetch(`${apiUrl}/api/wa/upload-media`, {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.message || 'Erro no upload')
        }
        
        const { mediaId } = await uploadResponse.json()
        console.log('✅ Upload concluído, mediaId:', mediaId)
        
        // 2. Enviar mensagem com o media_id
        const payload = {
          to: selectedConversation.contactPhone,
          type: type,
          media: {
            id: mediaId,
            caption: file.name,
            filename: file.name
          }
        }
        
        console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2))
        
        const sendResponse = await fetch(`${apiUrl}/api/wa/send-public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (sendResponse.ok) {
          // Atualizar mensagem temporária para sucesso
          const successMessage: Message = {
            id: `file-${Date.now()}`,
            content: `${fileEmoji} ${file.name}`,
            fromMe: true,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: type === 'image' ? 'image' : type === 'video' ? 'video' : type === 'audio' ? 'audio' : 'document'
          }
          
          setSelectedConversation(prev => prev ? {
            ...prev,
            messages: prev.messages.map(m => 
              m.id === tempMessage.id ? successMessage : m
            ),
            lastMessage: `${fileEmoji} ${file.name}`,
            lastMessageTime: 'Agora'
          } : null)
          
          setConversations(prev => prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, lastMessage: `${fileEmoji} ${file.name}`, lastMessageTime: 'Agora' }
              : conv
          ))
          
          console.log('✅ Arquivo enviado com sucesso!')
        } else {
          const error = await sendResponse.json()
          throw new Error(error.message || 'Erro ao enviar')
        }
      } catch (error) {
        console.error('❌ Erro ao enviar arquivo:', error)
        
        // Remover mensagem temporária em caso de erro
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempMessage.id)
        } : null)
        
        alert(`❌ Erro ao enviar arquivo: ${(error as Error).message}`)
      }
    }
    
    input.click()
  }

  // Função para enviar contato via WhatsApp
  const handleSendContact = async () => {
    if (!selectedConversation || !contactToSend.name.trim() || !contactToSend.phone.trim()) {
      alert('Preencha o nome e telefone do contato')
      return
    }

    setSendingContact(true)
    
    // Formatar telefone (remover caracteres não numéricos e adicionar código do país se necessário)
    let formattedPhone = contactToSend.phone.replace(/\D/g, '')
    if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
      formattedPhone = '55' + formattedPhone
    }

    // Mensagem temporária
    const tempMessage: Message = {
      id: `contact-${Date.now()}`,
      content: `👤 Contato: ${contactToSend.name}\n📞 ${contactToSend.phone}`,
      fromMe: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempMessage]
    } : null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Formato de contato do WhatsApp Business API
      const contactPayload = [{
        name: {
          formatted_name: contactToSend.name,
          first_name: contactToSend.name.split(' ')[0],
          last_name: contactToSend.name.split(' ').slice(1).join(' ') || undefined
        },
        phones: [{
          phone: formattedPhone,
          type: 'CELL'
        }]
      }]

      const response = await fetch(`${apiUrl}/api/wa/send-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.contactPhone,
          type: 'contacts',
          contacts: contactPayload
        })
      })

      if (response.ok) {
        console.log('✅ Contato enviado com sucesso!')
        setShowContactModal(false)
        setContactToSend({ name: '', phone: '' })
        
        // Atualizar última mensagem
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: `👤 ${contactToSend.name}`, lastMessageTime: 'Agora' }
            : conv
        ))
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao enviar contato')
      }
    } catch (error) {
      console.error('❌ Erro ao enviar contato:', error)
      
      // Remover mensagem temporária
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempMessage.id)
      } : null)
      
      alert(`❌ Erro ao enviar contato: ${(error as Error).message}`)
    } finally {
      setSendingContact(false)
    }
  }

  const handleContactAction = (action: string) => {
    setShowContactMenu(false)
    
    if (!selectedConversation) return
    
    switch(action) {
      case 'profile':
        // Abrir modal de edição do contato
        handleOpenContactEdit()
        break
        
      case 'mute':
        const isMuted = localStorage.getItem(`muted_${selectedConversation.id}`) === 'true'
        if (isMuted) {
          localStorage.removeItem(`muted_${selectedConversation.id}`)
          alert(`🔊 Conversa com ${selectedConversation.contactName} foi reativada`)
        } else {
          localStorage.setItem(`muted_${selectedConversation.id}`, 'true')
          alert(`🔇 Conversa com ${selectedConversation.contactName} foi silenciada`)
        }
        break
        
      case 'archive':
        if (confirm(`📁 Arquivar conversa com ${selectedConversation.contactName}?`)) {
          handleArchiveConversation(selectedConversation.id.toString(), true)
        }
        break
        
      case 'unarchive':
        handleArchiveConversation(selectedConversation.id.toString(), false)
        break
        
      case 'delete':
        handleDeleteConversation(selectedConversation.id.toString())
        break
        
      case 'leave':
        handleLeaveConversation()
        break
        
      case 'transfer':
        handleOpenTransferModal()
        break
        
      case 'export':
        handleExportConversation()
        break
        
      case 'toggle-golden':
        handleToggleGolden()
        break
    }
  }

  const updateConversationTags = (conversationId: string, isGolden: boolean) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        let newTags = conv.contactTags || []
        if (isGolden && !newTags.includes('Golden')) {
          newTags = [...newTags, 'Golden']
        } else if (!isGolden) {
          newTags = newTags.filter((t: string) => t !== 'Golden')
        }
        return { ...conv, contactTags: newTags }
      }
      return conv
    }))

    setSelectedConversation(prev => {
      if (prev && prev.id === conversationId) {
        let newTags = prev.contactTags || []
        if (isGolden && !newTags.includes('Golden')) {
          newTags = [...newTags, 'Golden']
        } else if (!isGolden) {
          newTags = newTags.filter((t: string) => t !== 'Golden')
        }
        return { ...prev, contactTags: newTags }
      }
      return prev
    })
  }

  const handleToggleGolden = async () => {
    if (!selectedConversation || !selectedConversation.contactId) {
      alert('Contato não encontrado para adicionar marcação.')
      return
    }

    const isCurrentlyGolden = selectedConversation.contactTags?.includes('Golden')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    const contactId = selectedConversation.contactId

    try {
      if (isCurrentlyGolden) {
        // Remover tag
        const response = await fetch(`${apiUrl}/api/contacts/${contactId}/tags/Golden`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.user?.token}`,
          }
        })
        if (response.ok) {
          updateConversationTags(selectedConversation.id, false)
        } else {
          alert('Erro ao remover marcação Golden')
        }
      } else {
        // Adicionar tag
        const response = await fetch(`${apiUrl}/api/contacts/${contactId}/tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.token}`,
          },
          body: JSON.stringify({ tag: 'Golden' })
        })
        if (response.ok) {
          updateConversationTags(selectedConversation.id, true)
        } else {
          alert('Erro ao adicionar marcação Golden')
        }
      }
    } catch (error) {
      console.error('Erro ao alternar status Golden', error)
      alert('Erro de conexão ao atualizar status do cliente')
    }
  }
  
  // Exportar conversa para arquivo de texto
  const handleExportConversation = () => {
    if (!selectedConversation) return
    
    const lines: string[] = []
    lines.push('=' .repeat(60))
    lines.push(`EXPORTAÇÃO DE CONVERSA`)
    lines.push('=' .repeat(60))
    lines.push(`Contato: ${selectedConversation.contactName}`)
    lines.push(`WhatsApp: ${selectedConversation.contactPhone}`)
    lines.push(`Data da exportação: ${new Date().toLocaleString('pt-BR')}`)
    lines.push(`Total de mensagens: ${selectedConversation.messages.length}`)
    lines.push('=' .repeat(60))
    lines.push('')
    
    selectedConversation.messages.forEach((msg) => {
      const sender = msg.fromMe ? '📤 VOCÊ' : `📥 ${selectedConversation.contactName}`
      const timestamp = msg.timestamp
      
      lines.push(`[${timestamp}] ${sender}:`)
      
      // Tipo de mídia
      if (msg.type === 'audio') {
        lines.push(`  🎵 [Áudio]${msg.mediaUrl ? ` - ${msg.mediaUrl}` : ''}`)
      } else if (msg.type === 'image') {
        lines.push(`  📷 [Imagem]${msg.mediaUrl ? ` - ${msg.mediaUrl}` : ''}`)
      } else if (msg.type === 'video') {
        lines.push(`  🎥 [Vídeo]${msg.mediaUrl ? ` - ${msg.mediaUrl}` : ''}`)
      } else if (msg.type === 'document') {
        lines.push(`  📄 [Documento: ${msg.filename || 'arquivo'}]${msg.mediaUrl ? ` - ${msg.mediaUrl}` : ''}`)
      } else if (msg.type === 'sticker') {
        lines.push(`  🎨 [Figurinha]`)
      }
      
      // Conteúdo da mensagem
      if (msg.content) {
        lines.push(`  ${msg.content}`)
      }
      if (msg.caption) {
        lines.push(`  Legenda: ${msg.caption}`)
      }
      
      lines.push('')
    })
    
    lines.push('=' .repeat(60))
    lines.push('Fim da exportação')
    lines.push('=' .repeat(60))
    
    // Criar e baixar o arquivo
    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa_${selectedConversation.contactName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert(`✅ Conversa exportada com sucesso!`)
  }

  // Sair da conversa (remover atribuição)
  const handleLeaveConversation = async () => {
    if (!selectedConversation) return
    
    // Verificar se está atribuído ao usuário atual
    const currentUserId = (session?.user as any)?.id
    if (!selectedConversation.assignedTo || selectedConversation.assignedTo.id !== currentUserId) {
      alert('Você não está atribuído a esta conversa')
      return
    }
    
    if (!confirm(`Deseja sair do atendimento de ${selectedConversation.contactName}?\n\nA conversa ficará disponível para outros atendentes.`)) {
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/conversations/${selectedConversation.id}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        // Atualizar localmente
        setSelectedConversation(prev => prev ? {
          ...prev,
          assignedTo: null,
          assignedAt: null
        } : null)
        
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, assignedTo: null, assignedAt: null }
            : conv
        ))
        
        alert('✅ Você saiu do atendimento desta conversa')
      } else {
        alert('Erro ao sair da conversa')
      }
    } catch (error) {
      console.error('Erro ao sair da conversa:', error)
      alert('Erro ao sair da conversa')
    }
  }
  
  // Abrir modal de edição de contato (Ver Perfil)
  const handleOpenContactEdit = async () => {
    if (!selectedConversation) return
    
    // Pegar o atendente da conversa atual
    const conversationAssignedToId = selectedConversation.assignedTo?.id || selectedConversation.assignedToId || ''
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Buscar contato pelo telefone
      const response = await fetch(`${apiUrl}/api/contacts?search=${encodeURIComponent(selectedConversation.contactPhone)}&limit=1`)
      
      if (response.ok) {
        const data = await response.json()
        const contact = data.contacts?.[0]
        
        if (contact) {
          setEditingContactData(contact)
          setContactFormData({
            name: contact.name || selectedConversation.contactName,
            phoneE164: contact.phoneE164 || selectedConversation.contactPhone,
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
            tags: Array.isArray(contact.tags) ? contact.tags : [],
            // Priorizar o atendente da conversa, senão usa o do contato
            assignedToId: conversationAssignedToId || contact.assignedToId || ''
          })
        } else {
          // Contato não existe, criar novo com atendente da conversa
          setEditingContactData(null)
          setContactFormData({
            name: selectedConversation.contactName,
            phoneE164: selectedConversation.contactPhone,
            email: '',
            company: '',
            role: '',
            notes: '',
            birthday: '',
            cpf: '',
            address: '',
            city: '',
            state: '',
            source: 'WhatsApp',
            interest: '',
            customerStatus: 'Lead',
            enrollmentDate: '',
            referredBy: '',
            tags: [],
            assignedToId: conversationAssignedToId
          })
        }
        
        setShowContactEditModal(true)
      }
    } catch (error) {
      console.error('Erro ao buscar contato:', error)
      alert('Erro ao carregar dados do contato')
    }
  }
  
  // Salvar contato editado
  const handleSaveContactEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      let phone = contactFormData.phoneE164.trim()
      if (!phone.startsWith('+')) {
        phone = '+' + phone.replace(/\D/g, '')
      }
      
      const payload = {
        name: contactFormData.name,
        phoneE164: phone,
        email: contactFormData.email || null,
        company: contactFormData.company || null,
        role: contactFormData.role || null,
        notes: contactFormData.notes || null,
        birthday: contactFormData.birthday || null,
        cpf: contactFormData.cpf || null,
        address: contactFormData.address || null,
        city: contactFormData.city || null,
        state: contactFormData.state || null,
        source: contactFormData.source || null,
        interest: contactFormData.interest || null,
        customerStatus: contactFormData.customerStatus || null,
        enrollmentDate: contactFormData.enrollmentDate || null,
        referredBy: contactFormData.referredBy || null,
        tags: contactFormData.tags,
        assignedToId: contactFormData.assignedToId || null
      }
      
      let response
      if (editingContactData) {
        // Atualizar contato existente
        response = await fetch(`${apiUrl}/api/contacts/${editingContactData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // Criar novo contato
        response = await fetch(`${apiUrl}/api/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      
      if (response.ok) {
        // Atualizar nome na conversa se mudou
        if (selectedConversation && contactFormData.name !== selectedConversation.contactName) {
          setSelectedConversation(prev => prev ? { ...prev, contactName: contactFormData.name } : null)
          setConversations(prev => prev.map(c => 
            c.id === selectedConversation.id ? { ...c, contactName: contactFormData.name } : c
          ))
        }
        
        setShowContactEditModal(false)
        alert('✅ Contato salvo com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao salvar: ${error.message || 'Tente novamente'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
      alert('Erro ao salvar contato')
    }
  }
  
  // Adicionar tag ao contato
  const handleAddContactTag = () => {
    if (contactTagInput.trim() && !contactFormData.tags.includes(contactTagInput.trim())) {
      setContactFormData({ ...contactFormData, tags: [...contactFormData.tags, contactTagInput.trim()] })
      setContactTagInput('')
    }
  }
  
  // Remover tag do contato
  const handleRemoveContactTag = (tag: string) => {
    setContactFormData({ ...contactFormData, tags: contactFormData.tags.filter(t => t !== tag) })
  }
  
  // Abrir modal de transferência
  const handleOpenTransferModal = async () => {
    if (!selectedConversation) return
    
    setShowTransferModal(true)
    setLoadingUsers(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const users = await response.json()
        const currentUserId = (session?.user as any)?.id
        // Mostrar todos os usuários, incluindo o atual (para ele poder assumir para si)
        setAvailableUsers(users)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoadingUsers(false)
    }
  }
  
  // Transferir conversa para outro atendente
  const handleTransferConversation = async (toUserId: string, toUserName: string) => {
    if (!selectedConversation) return
    
    setTransferring(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Primeiro remover atribuição atual
      await fetch(`${apiUrl}/api/conversations/${selectedConversation.id}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      // Depois atribuir ao novo usuário
      const response = await fetch(`${apiUrl}/api/conversations/${selectedConversation.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: toUserId,
          userName: toUserName,
          transferredBy: (session?.user as any)?.name || 'Outro atendente'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Buscar cor do usuário de destino
        const toUser = users.find(u => u.id === toUserId)
        const assignedToWithColor = { id: toUserId, name: toUserName, color: toUser?.color || '#3B82F6' }
        
        // Atualizar localmente
        setSelectedConversation(prev => prev ? {
          ...prev,
          assignedTo: assignedToWithColor,
          assignedAt: new Date().toISOString()
        } : null)
        
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, assignedTo: assignedToWithColor, assignedAt: new Date().toISOString() }
            : conv
        ))
        
        setShowTransferModal(false)
        alert(`✅ Conversa transferida para ${toUserName}`)
      } else {
        const error = await response.json()
        alert(`Erro: ${error.message || 'Não foi possível transferir'}`)
      }
    } catch (error) {
      console.error('Erro ao transferir conversa:', error)
      alert('Erro ao transferir conversa')
    } finally {
      setTransferring(false)
    }
  }

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Não fechar se clicar dentro do popup de respostas rápidas
      if (showQuickReplies && target.closest('.quick-replies-popup')) {
        return
      }
      
      setAttachmentMenu(false)
      setShowEmojiPicker(false)
      setShowContactMenu(false)
      setShowQuickReplies(false)
    }
    
    if (attachmentMenu || showEmojiPicker || showContactMenu || showQuickReplies) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [attachmentMenu, showEmojiPicker, showContactMenu, showQuickReplies])

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando conversas...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Modal de alerta quando conversa já está atribuída */}
      {showAssignmentAlert?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conversa em Atendimento</h3>
                <p className="text-sm text-gray-500">Esta conversa já está sendo atendida</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                O atendente <strong className="text-orange-700">{showAssignmentAlert.assignedTo}</strong> já está atendendo esta conversa.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Você pode visualizar a conversa, mas o atendimento está com outro usuário.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssignmentAlert(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowAssignmentAlert(null)
                  setSelectedConversation(null)
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Sair da Conversa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full bg-gray-100 dark:bg-gray-900">
        {/* Sidebar com conversas */}
        <div className={`bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col w-full lg:w-1/3 ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
              <MessageSquare className="mr-2 h-6 w-6 text-green-600" />
              Caixa de Entrada
            </h1>
            
            {/* Abas de filtro */}
            <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setConversationFilter('active')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  conversationFilter === 'active'
                    ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Ativas
              </button>
              <button
                onClick={() => setConversationFilter('campaigns')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  conversationFilter === 'campaigns'
                    ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Megaphone className="inline h-4 w-4 mr-1" />
                Campanhas
              </button>
              <button
                onClick={() => setConversationFilter('archived')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  conversationFilter === 'archived'
                    ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Archive className="inline h-4 w-4 mr-1" />
                Arquivadas
              </button>
            </div>
            
            {/* Seletor de Conta WhatsApp (Multi-números) */}
            {whatsappAccounts.length > 1 && (
              <div className="mb-4 relative">
                <button
                  onClick={() => setShowAccountFilter(!showAccountFilter)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      {selectedAccountId 
                        ? whatsappAccounts.find(a => a.id === selectedAccountId)?.name || 'Conta'
                        : 'Todas as Contas'
                      }
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-green-600 transition-transform ${showAccountFilter ? 'rotate-180' : ''}`} />
                </button>
                
                {showAccountFilter && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedAccountId('')
                        setShowAccountFilter(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !selectedAccountId ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                        <Phone className="h-3 w-3 text-white" />
                      </div>
                      <span>Todas as Contas</span>
                    </button>
                    {whatsappAccounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountId(account.id)
                          setShowAccountFilter(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedAccountId === account.id ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${account.isDefault ? 'bg-green-500' : 'bg-blue-500'}`}>
                          <Phone className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{account.name}</span>
                            {account.isDefault && (
                              <span className="text-[10px] px-1 py-0.5 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 rounded">
                                Padrão
                              </span>
                            )}
                          </div>
                          {account.phoneNumber && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{account.phoneNumber}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Filtros Avançados */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Filtro por Atendente */}
              <select
                value={inboxFilters.assignedToId}
                onChange={(e) => setInboxFilters(prev => ({ ...prev, assignedToId: e.target.value }))}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="">Atendente</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>

              {/* Filtro por Tag (não mostrar em Ativas) */}
              {conversationFilter !== 'active' && (
                <select
                  value={inboxFilters.tag}
                  onChange={(e) => setInboxFilters(prev => ({ ...prev, tag: e.target.value }))}
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white max-w-[150px]"
                >
                  <option value="">Tag</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}

              {/* Toggle Pendentes (não lidos) */}
              <button
                onClick={() => setInboxFilters(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
                className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                  inboxFilters.unreadOnly
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Pendentes
              </button>

              {/* Limpar filtros (mostra só quando tem filtro ativo) */}
              {(inboxFilters.assignedToId || inboxFilters.tag || inboxFilters.unreadOnly) && (
                <button
                  onClick={() => setInboxFilters({ assignedToId: '', campaignId: '', tag: '', unreadOnly: false })}
                  className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>
          
          {/* Lista de conversas */}
          <div 
            className="flex-1 overflow-y-auto relative"
            ref={conversationsListRef}
            onScroll={handleConversationsScroll}
          >
            {loadingSearch && (
              <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/60 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-md border dark:border-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Buscando...</span>
                </div>
              </div>
            )}
            {filteredConversations.length > 0 ? (
              <>
                {filteredConversations.map((conversation) => {
                  const isGolden = conversation.contactTags?.includes('Golden')
                  let bgColorClass = isGolden ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-white dark:bg-gray-800'
                  
                  let isOver6Hours = false;
                  // Se houver mensagem não lida E houver data de recebimento (SLA)
                  if (conversation.unreadCount > 0) {
                    // Usar lastIncomingMessageAt, se não existir cai para fallback (melhor que nada)
                    const incomingTime = conversation.lastIncomingMessageAt || conversation.updatedAt || new Date().toISOString();
                    const waitTimeMs = new Date().getTime() - new Date(incomingTime).getTime()
                    const waitTimeHours = waitTimeMs / (1000 * 60 * 60)
                    
                    if (waitTimeHours > 6) {
                      bgColorClass = 'bg-gray-300 dark:bg-gray-700' // Cinza
                      isOver6Hours = true;
                    } else if (waitTimeHours > 4) {
                      bgColorClass = 'bg-red-100 dark:bg-red-900/40' // Vermelho claro
                    } else if (waitTimeHours > 2) {
                      bgColorClass = 'bg-yellow-100 dark:bg-yellow-900/40' // Amarelo claro
                    } else {
                      bgColorClass = 'bg-green-100 dark:bg-green-900/40' // Verde claro
                    }
                  } else if (selectedConversation?.id === conversation.id) {
                    // Selecionado mas não tem mensagem não lida
                    bgColorClass = 'bg-blue-50 dark:bg-blue-900/20'
                  }

                  const borderClass = selectedConversation?.id === conversation.id 
                    ? 'border-l-4 border-l-blue-500' 
                    : 'border-l-4 border-transparent'

                  return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:opacity-80 transition-all ${bgColorClass} ${borderClass}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className={`w-12 h-12 ${!conversation.assignedTo ? (isGolden ? 'bg-amber-200 dark:bg-amber-700' : 'bg-green-200 dark:bg-green-800') : ''} rounded-full flex items-center justify-center flex-shrink-0`}
                        style={conversation.assignedTo ? { backgroundColor: conversation.assignedTo.color || '#3B82F6' } : {}}
                      >
                        <span className={`text-lg font-bold ${conversation.assignedTo ? 'text-white' : (isGolden ? 'text-amber-900 dark:text-amber-100' : 'text-green-900 dark:text-green-100')}`}>
                          {conversation.contactName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                            {conversation.contactName}
                          </p>
                          <div className="flex items-center space-x-2">
                            {/* Bolinha dourada indicando cliente Golden */}
                            {isGolden && (
                              <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.6)]" title="Cliente Golden"></span>
                            )}
                            {/* Bolinha verde/preta indicando demanda de resposta */}
                            {conversation.unreadCount > 0 && (
                              <span className={`w-2 h-2 rounded-full ${isOver6Hours ? 'bg-black shadow-[0_0_5px_rgba(0,0,0,0.6)]' : 'bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.6)]'}`} title="Aguardando resposta do consultor"></span>
                            )}

                            {/* Indicador de atendente com cor personalizada */}
                            {conversation.assignedTo && (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: conversation.assignedTo.color || '#3B82F6' }}
                              >
                                {conversation.assignedTo.name.split(' ')[0]}
                              </span>
                            )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">{conversation.lastMessageTime}</p>
                          {conversation.unreadCount > 0 && (
                            <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full ${isOver6Hours ? 'bg-gray-800 dark:bg-black' : 'bg-green-600'}`}>
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {conversation.contactPhone}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
                )
              })}
              {/* Indicador de carregamento e botão para carregar mais */}
              {loadingMore && (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-green-600 mx-auto" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Carregando mais...</span>
                </div>
              )}
              {hasMoreConversations && !loadingMore && (
                <button
                  onClick={loadMoreConversations}
                  className="w-full p-3 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  Carregar mais conversas
                </button>
              )}
              {!hasMoreConversations && conversations.length > CONVERSATIONS_PER_PAGE && (
                <div className="p-3 text-center text-xs text-gray-400">
                  Todas as {conversations.length} conversas carregadas
                </div>
              )}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </div>
            )}
          </div>
        </div>

        {/* Área de mensagens */}
        <div className={`flex-1 flex-col ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Header da conversa */}
              <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 -ml-2 mr-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div 
                    className={`w-10 h-10 ${!selectedConversation.assignedTo ? 'bg-green-100' : ''} rounded-full flex items-center justify-center flex-shrink-0`}
                    style={selectedConversation.assignedTo ? { backgroundColor: selectedConversation.assignedTo.color || '#3B82F6' } : {}}
                  >
                    <span className={`text-base font-bold ${selectedConversation.assignedTo ? 'text-white' : 'text-green-800'}`}>
                      {selectedConversation.contactName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium text-gray-900">
                        {selectedConversation.contactName}
                      </h2>
                      {selectedConversation.assignedTo && (
                        <span 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: selectedConversation.assignedTo.color || '#3B82F6' }}
                        >
                          {selectedConversation.assignedTo.name.split(' ')[0]}
                        </span>
                      )}
                      {/* Indicador de janela 24h */}
                      {(() => {
                        const windowStatus = get24hWindowStatus(selectedConversation.lastIncomingMessageAt)
                        if (windowStatus.isOpen) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="Janela de 24h do WhatsApp aberta - pode enviar mensagens">
                              ✅ {windowStatus.hoursRemaining}h {windowStatus.minutesRemaining}m restantes
                            </span>
                          )
                        } else if (windowStatus.neverReplied) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700" title="Cliente ainda não respondeu - use templates para iniciar conversa">
                              📤 Aguardando resposta do cliente
                            </span>
                          )
                        } else {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700" title="Janela de 24h expirada - use templates">
                              🔒 Janela expirada - Use Template
                            </span>
                          )
                        }
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">{selectedConversation.contactPhone}</p>
                      {selectedConversation.contactTags && selectedConversation.contactTags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400 font-medium">Tags:</span>
                          {selectedConversation.contactTags.map((tag: string, index: number) => (
                            <span 
                              key={index} 
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                tag.toLowerCase() === 'golden' 
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 relative">
                  {selectedConversation.unreadCount > 0 && (
                    <button
                      onClick={() => markConversationAsRead(selectedConversation.id.toString())}
                      className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors"
                      title="Dispensar Resposta (Marcar como lido)"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  )}
                  <button 
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowContactMenu(!showContactMenu)
                    }}
                    title="Opções do contato"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  
                  {showContactMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-2xl z-50 border border-[#E8B868]/30"
                         onClick={(e) => e.stopPropagation()}>
                      <div className="py-1">
                        <button
                          onClick={() => handleContactAction('profile')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Ver Perfil
                        </button>
                        <button
                          onClick={() => handleContactAction('mute')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {localStorage.getItem(`muted_${selectedConversation?.id}`) === 'true' ? (
                            <>
                              <Volume2 className="mr-3 h-4 w-4" />
                              Reativar
                            </>
                          ) : (
                            <>
                              <VolumeX className="mr-3 h-4 w-4" />
                              Silenciar
                            </>
                          )}
                        </button>
                        {selectedConversation.status === 'archived' ? (
                          <button
                            onClick={() => handleContactAction('unarchive')}
                            className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <ArchiveRestore className="mr-3 h-4 w-4" />
                            Desarquivar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleContactAction('archive')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Archive className="mr-3 h-4 w-4" />
                            Arquivar
                          </button>
                        )}
                        
                        {/* Opções de atribuição */}
                        <hr className="my-1" />
                        {selectedConversation.assignedTo?.id === (session?.user as any)?.id && (
                          <button
                            onClick={() => handleContactAction('leave')}
                            className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Sair do Atendimento
                          </button>
                        )}
                        {selectedConversation.unreadCount > 0 && (
                          <button
                            onClick={() => {
                              setShowContactMenu(false);
                              markConversationAsRead(selectedConversation.id.toString());
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-[#2A3A32] hover:bg-[#E8B868]/20 transition-colors font-bold"
                          >
                            <CheckCircle2 className="mr-3 h-4 w-4 text-green-600" />
                            Fim de Interação
                          </button>
                        )}
                        <button
                          onClick={() => handleContactAction('toggle-golden')}
                          className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors font-medium"
                        >
                          {selectedConversation.contactTags?.includes('Golden') ? (
                            <>
                              <StarOff className="mr-3 h-4 w-4" />
                              Remover Golden
                            </>
                          ) : (
                            <>
                              <Star className="mr-3 h-4 w-4" />
                              Marcar como Golden
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleContactAction('transfer')}
                          className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <ArrowRightLeft className="mr-3 h-4 w-4" />
                          Transferir Conversa
                        </button>
                        <button
                          onClick={() => handleContactAction('export')}
                          className="flex items-center w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Download className="mr-3 h-4 w-4" />
                          Exportar Conversa
                        </button>
                        
                        <hr className="my-1" />
                        <button
                          onClick={() => handleContactAction('delete')}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="mr-3 h-4 w-4" />
                          Excluir Conversa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mensagens */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              >
                {selectedConversation.messages.map((message) => {
                  // Resolver replyTo a partir do ID
                  let resolvedReplyTo = message.replyTo
                  if (!resolvedReplyTo && message.replyToMessageId) {
                    const replyMsg = selectedConversation.messages.find(m => 
                      m.id === message.replyToMessageId || 
                      m.waMessageId === message.replyToMessageId
                    )
                    if (replyMsg) {
                      resolvedReplyTo = {
                        id: replyMsg.id,
                        content: replyMsg.content || '[mídia]',
                        fromMe: replyMsg.fromMe
                      }
                    }
                  }
                  
                  if (message.type === 'system') {
                    return (
                      <div key={message.id} className="flex justify-center my-4 w-full">
                        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-200 shadow-sm text-center">
                          {message.content}
                        </span>
                      </div>
                    )
                  }
                  
                  return (
                  <div
                    key={message.id}
                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                      message.fromMe 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      {/* Reply indicator - quando é resposta a uma mensagem específica */}
                      {resolvedReplyTo && (
                        <div className={`text-xs px-2 py-1 rounded mb-2 border-l-2 ${
                          message.fromMe 
                            ? 'bg-green-700 border-green-300' 
                            : 'bg-gray-100 border-gray-400'
                        }`}>
                          <span className="font-medium">
                            {resolvedReplyTo.fromMe ? 'Você' : selectedConversation.contactName}:
                          </span>
                          <p className="truncate">{resolvedReplyTo.content}</p>
                        </div>
                      )}
                      
                      {/* Indicador de resposta de botão */}
                      {(message.type === 'button' || message.type === 'interactive') && !message.fromMe && (
                        <span className={`text-xs px-1.5 py-0.5 rounded mb-1 inline-block bg-blue-100 text-blue-700`}>
                          🔘 Botão clicado
                        </span>
                      )}
                      
                      {message.type === 'template' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded mb-1 inline-block ${message.fromMe ? 'bg-green-700 text-green-100' : 'bg-gray-100 text-gray-600'}`}>
                          📄 Template
                        </span>
                      )}
                      
                      {/* Exibição de sticker */}
                      {message.type === 'sticker' && (
                        <div className="mb-1">
                          {message.mediaUrl ? (
                            <img 
                              src={message.mediaUrl} 
                              alt="Sticker" 
                              className="max-w-[150px] max-h-[150px] rounded"
                              onError={(e) => {
                                // Se falhar, mostrar emoji
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`flex items-center gap-2 ${message.mediaUrl ? 'hidden' : ''}`}>
                            <span className="text-4xl">🎨</span>
                            <span className="text-sm">Figurinha</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Exibição de mídia */}
                      {message.type === 'image' && (
                        <div className="mb-1">
                          {message.mediaUrl ? (
                            <img 
                              src={message.mediaUrl} 
                              alt="Imagem" 
                              className="max-w-[250px] max-h-[250px] rounded cursor-pointer hover:opacity-90"
                              onClick={() => window.open(message.mediaUrl, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📷</span>
                              <span className="text-sm font-medium">Imagem</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.type === 'video' && (
                        <div className="mb-1">
                          {message.mediaUrl ? (
                            <video 
                              src={message.mediaUrl} 
                              controls
                              className="max-w-[250px] max-h-[200px] rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎥</span>
                              <span className="text-sm font-medium">Vídeo</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.type === 'audio' && (
                        <div className="mb-1">
                          {message.mediaUrl ? (
                            <audio 
                              src={message.mediaUrl} 
                              controls
                              className="max-w-[250px]"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎵</span>
                              <span className="text-sm font-medium">Áudio</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.type === 'document' && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📄</span>
                          <span className="text-sm font-medium">{message.filename || 'Documento'}</span>
                          {message.mediaUrl && (
                            <a 
                              href={message.mediaUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs underline hover:opacity-80"
                            >
                              Baixar
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Conteúdo/Caption da mensagem */}
                      {(message.content || message.caption) && (
                        <p className="text-sm whitespace-pre-wrap">{message.content || message.caption}</p>
                      )}
                      
                      {/* Botões interativos (se houver) */}
                      {message.buttons && message.buttons.length > 0 && message.fromMe && (
                        <div className="mt-2 space-y-1">
                          {message.buttons.map((btn, idx) => (
                            <div 
                              key={idx}
                              className="text-xs px-2 py-1 bg-green-700 rounded text-center text-green-100 border border-green-500"
                            >
                              {btn.title}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        message.fromMe ? 'text-green-100 justify-end' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                        {/* Ícones de status - só para mensagens enviadas por nós */}
                        {message.fromMe && (
                          <span className="inline-flex items-center" title={
                            message.status === 'PENDING' ? 'Enviando...' :
                            message.status === 'SENT' ? 'Enviada' :
                            message.status === 'DELIVERED' ? 'Entregue' :
                            message.status === 'READ' ? 'Lida' :
                            message.status === 'FAILED' ? 'Falha no envio' : 'Enviada'
                          }>
                            {message.status === 'PENDING' && (
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            )}
                            {message.status === 'SENT' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            {message.status === 'DELIVERED' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="18 6 7 17 2 12"/>
                                <polyline points="23 6 12 17"/>
                              </svg>
                            )}
                            {message.status === 'READ' && (
                              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="18 6 7 17 2 12"/>
                                <polyline points="23 6 12 17"/>
                              </svg>
                            )}
                            {message.status === 'FAILED' && (
                              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                            )}
                            {!message.status && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </span>
                        )}
                      </p>
                      
                      {/* Botão de reply (aparece no hover) */}
                      <button
                        onClick={() => setReplyingTo(message)}
                        className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                          message.fromMe 
                            ? '-left-8 text-gray-500 hover:text-gray-700' 
                            : '-right-8 text-gray-500 hover:text-gray-700'
                        }`}
                        title="Responder"
                      >
                        <Reply className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )})}
                <div ref={messagesEndRef} />
                
                {/* Botão scroll para baixo */}
                {showScrollButton && (
                  <button
                    onClick={() => scrollToBottom(true)}
                    className="fixed bottom-32 right-8 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-10"
                    title="Ir para o final"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Input de nova mensagem */}
              <div className="bg-white border-t p-4">
                {/* Reply preview */}
                {replyingTo && (
                  <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 mb-2 border-l-4 border-green-500">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-green-600 font-medium">
                        Respondendo a {replyingTo.fromMe ? 'você mesmo' : selectedConversation.contactName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{replyingTo.content}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-end space-x-2">
                  <div className="relative">
                    <button 
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={handleAttachFile}
                      title="Anexar arquivo"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    
                    {attachmentMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-md shadow-lg z-20 border"
                           onClick={(e) => e.stopPropagation()}>
                        <div className="py-1">
                          <button
                            onClick={() => handleFileUpload('image')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3 text-lg">🖼️</span>
                            Foto
                          </button>
                          <button
                            onClick={() => handleFileUpload('video')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3 text-lg">🎥</span>
                            Vídeo
                          </button>
                          <button
                            onClick={() => handleFileUpload('document')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3 text-lg">📄</span>
                            Documento
                          </button>
                          <button
                            onClick={() => handleFileUpload('audio')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3 text-lg">🎵</span>
                            Áudio
                          </button>
                          <button
                            onClick={() => {
                              setAttachmentMenu(false)
                              setShowContactModal(true)
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3 text-lg">👤</span>
                            Contato
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button 
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={handleEmojiPicker}
                      title="Adicionar emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-md shadow-lg z-20 border p-3"
                           onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Escolha um emoji:</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                            '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                            '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                            '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
                            '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖖',
                            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                            '💯', '💪', '👏', '🙌', '👐', '🤝', '🙏', '✨'].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => insertEmojiAtCursor(emoji)}
                              className="text-lg p-1 hover:bg-gray-100 rounded transition-colors"
                              title={`Adicionar ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de Templates */}
                  <button 
                    className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={handleOpenTemplates}
                    title="Enviar template aprovado"
                  >
                    <FileText className="h-5 w-5" />
                  </button>
                  
                  {/* Botão de Respostas Rápidas */}
                  <div className="relative">
                    <button 
                      className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={handleOpenQuickReplies}
                      title="Respostas rápidas"
                    >
                      <Zap className="h-5 w-5" />
                    </button>
                    
                    {showQuickReplies && (
                      <div className="quick-replies-popup absolute bottom-full left-0 mb-2 w-96 bg-white rounded-lg shadow-xl z-20 border max-h-[400px] flex flex-col"
                           onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-3 border-b bg-purple-50 rounded-t-lg">
                          <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Respostas Rápidas
                          </h4>
                        </div>
                        
                        {/* Busca e Filtros */}
                        <div className="p-2 border-b space-y-2 bg-gray-50" onClick={(e) => e.stopPropagation()}>
                          {/* Campo de busca */}
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Buscar resposta..."
                              value={quickReplySearch}
                              onChange={(e) => setQuickReplySearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                              autoFocus
                            />
                          </div>
                          
                          {/* Filtro por categoria */}
                          {quickReplyCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setQuickReplyCategory(null); }}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                  !quickReplyCategory 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Todas
                              </button>
                              {quickReplyCategories.map((cat) => (
                                <button
                                  key={cat}
                                  onClick={(e) => { e.stopPropagation(); setQuickReplyCategory(cat); }}
                                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                    quickReplyCategory === cat 
                                      ? 'bg-purple-600 text-white' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Lista de respostas */}
                        <div className="flex-1 overflow-y-auto">
                          {loadingQuickReplies ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto text-purple-400" />
                              <p className="text-xs text-gray-500 mt-1">Carregando...</p>
                            </div>
                          ) : filteredQuickReplies.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              {quickReplies.length === 0 ? (
                                <>
                                  <p>Nenhuma resposta rápida cadastrada</p>
                                  <a href="/settings" className="text-purple-600 hover:underline mt-1 block">
                                    Gerenciar respostas rápidas
                                  </a>
                                </>
                              ) : (
                                <p>Nenhuma resposta encontrada para "{quickReplySearch}"</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              {filteredQuickReplies.map((reply) => (
                                <button
                                  key={reply.id}
                                  onClick={() => handleSelectQuickReply(reply.content)}
                                  className="flex flex-col w-full px-3 py-2.5 text-left hover:bg-purple-50 transition-colors border-b last:border-b-0"
                                >
                                  <div className="flex items-center gap-2">
                                    {reply.categoryColor && (
                                      <span 
                                        className="w-2 h-2 rounded-full flex-shrink-0" 
                                        style={{ backgroundColor: reply.categoryColor }}
                                      />
                                    )}
                                    <span className="text-sm font-medium text-gray-900">{reply.title}</span>
                                    {reply.category && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 ml-auto">
                                        {reply.category}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reply.content}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-2 border-t bg-gray-50 rounded-b-lg">
                          <a 
                            href="/settings" 
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center justify-center gap-1"
                          >
                            <Settings className="h-3 w-3" />
                            Gerenciar respostas
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 relative">
                    {(() => {
                      const windowStatus = get24hWindowStatus(selectedConversation.lastIncomingMessageAt)
                      const isWindowClosed = !windowStatus.isOpen
                      
                      let placeholderText = "Digite sua mensagem... (Shift+Enter para nova linha)"
                      if (isWindowClosed) {
                        placeholderText = windowStatus.neverReplied 
                          ? "📤 Cliente não respondeu ainda - Use template (📄) para iniciar"
                          : "🔒 Janela de 24h expirada - Use template (📄) para reabrir"
                      }
                      
                      return (
                        <>
                          <textarea
                            placeholder={placeholderText}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                              }
                            }}
                            rows={1}
                            disabled={isWindowClosed}
                            style={{ minHeight: '40px', maxHeight: '120px', resize: 'none' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement
                              target.style.height = 'auto'
                              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                            }}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 overflow-hidden ${
                              isWindowClosed 
                                ? 'border-red-300 bg-red-50 text-red-600 cursor-not-allowed' 
                                : 'border-gray-300'
                            }`}
                          />
                        </>
                      )
                    })()}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !get24hWindowStatus(selectedConversation.lastIncomingMessageAt).isOpen}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={get24hWindowStatus(selectedConversation.lastIncomingMessageAt).isOpen 
                      ? "Enviar mensagem" 
                      : "Janela de 24h fechada - use templates"}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                <p className="text-sm">Escolha uma conversa da lista para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Templates */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">
                  {selectedTemplateForEdit ? 'Configurar Template' : 'Enviar Template'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowTemplateModal(false)
                  setSelectedTemplateForMedia(null)
                  setSelectedTemplateForEdit(null)
                  setTemplateVariables([])
                  setMediaUrl('')
                  setSelectedFile(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Formulário de edição do template (variáveis e mídia) */}
              {selectedTemplateForEdit ? (
                <div className="space-y-4">
                  {/* Info do template */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-lg">{selectedTemplateForEdit.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                        {selectedTemplateForEdit.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                      {selectedTemplateForEdit.bodyText}
                    </p>
                  </div>

                  {/* Variáveis do template */}
                  {templateVariables.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        📝 Preencha as variáveis do template:
                      </label>
                      {templateVariables.map((value, index) => (
                        <div key={index}>
                          <label className="block text-xs text-gray-500 mb-1">
                            Variável {`{{${index + 1}}}`}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newVars = [...templateVariables]
                              newVars[index] = e.target.value
                              setTemplateVariables(newVars)
                            }}
                            placeholder={`Digite o valor para {{${index + 1}}}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload de mídia (se necessário) */}
                  {selectedTemplateForEdit.requiresMedia && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Este template requer {selectedTemplateForEdit.headerFormat?.toLowerCase() === 'video' ? 'um vídeo' : 
                                selectedTemplateForEdit.headerFormat?.toLowerCase() === 'document' ? 'um documento' : 'uma imagem'}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Faça upload de um arquivo ou cole uma URL
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Upload de arquivo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <ImageIcon className="h-4 w-4 inline mr-1" />
                          Anexar Arquivo
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                          <input
                            type="file"
                            accept={
                              selectedTemplateForEdit.headerFormat?.toLowerCase() === 'video' 
                                ? 'video/mp4,video/3gpp' 
                                : selectedTemplateForEdit.headerFormat?.toLowerCase() === 'document'
                                  ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                  : 'image/jpeg,image/png,image/webp'
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setSelectedFile(file)
                                setMediaUrl('')
                              }
                            }}
                            className="hidden"
                            id="template-media-upload"
                          />
                          <label htmlFor="template-media-upload" className="cursor-pointer">
                            {selectedFile ? (
                              <div className="flex items-center justify-center space-x-2">
                                <ImageIcon className="h-8 w-8 text-green-600" />
                                <div className="text-left">
                                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Clique para selecionar um arquivo</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {selectedTemplateForEdit.headerFormat?.toLowerCase() === 'video' 
                                    ? 'MP4, 3GP' 
                                    : selectedTemplateForEdit.headerFormat?.toLowerCase() === 'document'
                                      ? 'PDF, DOC, DOCX'
                                      : 'JPG, PNG, WebP'}
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Divisor OU */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">ou</span>
                        </div>
                      </div>

                      {/* URL do arquivo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL do Arquivo
                        </label>
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={(e) => {
                            setMediaUrl(e.target.value)
                            setSelectedFile(null)
                          }}
                          placeholder="https://exemplo.com/arquivo"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          disabled={!!selectedFile}
                        />
                      </div>
                    </>
                  )}

                  {/* Botões de ação */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedTemplateForEdit(null)
                        setSelectedTemplateForMedia(null)
                        setTemplateVariables([])
                        setMediaUrl('')
                        setSelectedFile(null)
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleSendTemplateWithFile}
                      disabled={
                        (selectedTemplateForEdit.requiresMedia && !mediaUrl && !selectedFile) || 
                        (templateVariables.length > 0 && templateVariables.some(v => !v.trim())) ||
                        sendingTemplate === selectedTemplateForEdit.id || 
                        uploadingImage
                      }
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Enviando...
                        </>
                      ) : sendingTemplate === selectedTemplateForEdit.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Enviar Template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Carregando templates...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Nenhum template aprovado encontrado</p>
                  <p className="text-sm mt-1">Crie templates na página de Templates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Enviando para: <strong>{selectedConversation?.contactName}</strong>
                  </p>
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className="border rounded-lg p-4 hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className="font-medium">{template.name}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprovado
                            </span>
                            {template.requiresMedia && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {template.headerFormat === 'VIDEO' ? 'Requer Vídeo' : 
                                 template.headerFormat === 'DOCUMENT' ? 'Requer Documento' : 'Requer Imagem'}
                              </span>
                            )}
                            {extractTemplateVariables(template.bodyText || '') > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                📝 {extractTemplateVariables(template.bodyText || '')} variável(is)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {template.category} • {template.language}
                          </p>
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                            {template.bodyText || 'Sem texto'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleTemplateClick(template)}
                          disabled={sendingTemplate === template.id}
                          className="ml-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                        >
                          {sendingTemplate === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Enviar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferência */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Transferir Conversa</h3>
              </div>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Selecione o atendente para quem deseja transferir a conversa com <strong>{selectedConversation?.contactName}</strong>:
              </p>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Carregando atendentes...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum outro atendente disponível</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleTransferConversation(user.id, user.name)}
                      disabled={transferring}
                      className="w-full flex items-center p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-800">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                       <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">
                          {user.name}
                          {user.id === (session?.user as any)?.id && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Você</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {transferring ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio de Contato */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👤</span>
                <h3 className="text-lg font-semibold">Enviar Contato</h3>
              </div>
              <button 
                onClick={() => {
                  setShowContactModal(false)
                  setContactToSend({ name: '', phone: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  value={contactToSend.name}
                  onChange={(e) => setContactToSend(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={contactToSend.phone}
                  onChange={(e) => setContactToSend(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O código do país (55) será adicionado automaticamente se necessário
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2 p-4 border-t">
              <button
                onClick={() => {
                  setShowContactModal(false)
                  setContactToSend({ name: '', phone: '' })
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendContact}
                disabled={sendingContact || !contactToSend.name.trim() || !contactToSend.phone.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sendingContact ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Contato
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Contato (Ver Perfil) */}
      {showContactEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg my-4 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingContactData ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              <button onClick={() => setShowContactEditModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveContactEdit}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      value={contactFormData.name}
                      onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={contactFormData.phoneE164}
                      onChange={(e) => setContactFormData({ ...contactFormData, phoneE164: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-100"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Empresa</label>
                    <input
                      type="text"
                      value={contactFormData.company}
                      onChange={(e) => setContactFormData({ ...contactFormData, company: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Cargo</label>
                    <input
                      type="text"
                      value={contactFormData.role}
                      onChange={(e) => setContactFormData({ ...contactFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Notas</label>
                    <textarea
                      value={contactFormData.notes}
                      onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                      rows={2}
                    />
                  </div>
                  
                  {/* Dados Pessoais */}
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Dados Pessoais</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={contactFormData.birthday}
                      onChange={(e) => setContactFormData({ ...contactFormData, birthday: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">CPF</label>
                    <input
                      type="text"
                      value={contactFormData.cpf}
                      onChange={(e) => setContactFormData({ ...contactFormData, cpf: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Endereço</label>
                    <input
                      type="text"
                      value={contactFormData.address}
                      onChange={(e) => setContactFormData({ ...contactFormData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      value={contactFormData.city}
                      onChange={(e) => setContactFormData({ ...contactFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select
                      value={contactFormData.state}
                      onChange={(e) => setContactFormData({ ...contactFormData, state: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                      <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                      <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                      <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                      <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                      <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                      <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                      <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                      <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                    </select>
                  </div>
                  
                  {/* Dados Comerciais */}
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">💼 Dados Comerciais</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Origem</label>
                    <select
                      value={contactFormData.source}
                      onChange={(e) => setContactFormData({ ...contactFormData, source: e.target.value })}
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
                      value={contactFormData.interest}
                      onChange={(e) => setContactFormData({ ...contactFormData, interest: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={contactFormData.customerStatus}
                      onChange={(e) => setContactFormData({ ...contactFormData, customerStatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      {(statusOptions.length > 0 ? statusOptions : defaultStatusOptions).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Data Matrícula</label>
                    <input
                      type="date"
                      value={contactFormData.enrollmentDate}
                      onChange={(e) => setContactFormData({ ...contactFormData, enrollmentDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Indicado por</label>
                    <input
                      type="text"
                      value={contactFormData.referredBy}
                      onChange={(e) => setContactFormData({ ...contactFormData, referredBy: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Atendente</label>
                    <select
                      value={contactFormData.assignedToId}
                      onChange={(e) => setContactFormData({ ...contactFormData, assignedToId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Nenhum</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="border-t pt-4 mt-2">
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={contactTagInput}
                      onChange={(e) => setContactTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddContactTag())}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="Adicionar tag"
                    />
                    <button type="button" onClick={handleAddContactTag} className="px-4 py-2 bg-gray-200 rounded-lg">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contactFormData.tags.map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveContactTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowContactEditModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}