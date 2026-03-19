'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useRequirePermission } from '@/hooks/use-require-permission'
import { apiFetch } from '@/lib/api'
import { Megaphone, Mail, RefreshCw, Send, Search, Tag, Play, Pause } from 'lucide-react'

type EmailCampaign = {
  id: string
  name: string
  description?: string
  status: string
  subject: string
  htmlTemplate?: string
  preheader?: string | null
  filterTags?: string | null
  filterStatus?: string | null
  filterSource?: string | null
  excludeOptOut: boolean
  sendRatePerMinute: number
  totalContacts: number
  sentCount: number
  deliveredCount: number
  readCount: number
  clickedCount?: number
  failedCount: number
  scheduledAt?: string | null
  createdAt: string
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
  _count?: { messages: number }
}

type PipelineStage = {
  id: string
  name: string
  order: number
}

type CampaignMessageItem = {
  id: string
  contactEmail: string
  contactName?: string | null
  status: string
  clickCount?: number
  sentAt?: string | null
  readAt?: string | null
  firstClickedAt?: string | null
  lastClickedAt?: string | null
  error?: string | null
}

type FieldOption = {
  id: string
  fieldType: string
  value: string
  label: string
  order: number
}

export default function EmailMarketingPage() {
  const { status } = useSession()
  useRequirePermission('campaigns')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [stats, setStats] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])

  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [customerStatusOptions, setCustomerStatusOptions] = useState<FieldOption[]>([])
  const [sourceOptions, setSourceOptions] = useState<FieldOption[]>([])
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])

  // Form
  const [simpleMode, setSimpleMode] = useState(true)
  const [formName, setFormName] = useState('Campanha de E-mail')
  const [formSubject, setFormSubject] = useState('Novidade para você')
  const [formPreheader, setFormPreheader] = useState('Confira os detalhes e aproveite a oportunidade.')
  const [formHtml, setFormHtml] = useState(`
<div style="font-family: Arial, sans-serif; padding: 24px; background:#f8fafc;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 14px; padding: 24px; box-shadow: 0 10px 24px rgba(2,6,23,.08);">
    <div style="font-size: 12px; color:#64748b; margin-bottom: 10px;">Olá!</div>
    <h1 style="margin: 0 0 14px; color:#b91c1c; font-size: 22px;">Mensagem importante</h1>
    <p style="margin: 0 0 14px; color:#0f172a; line-height:1.6;">
      Temos uma novidade e queremos te avisar por aqui.
    </p>
    <a href="https://example.com" style="display:inline-block; background:#b91c1c; color:#fff; text-decoration:none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
      Clique aqui para saber mais
    </a>
    <p style="margin: 16px 0 0; color:#64748b; font-size:12px;">
      Você recebeu este e-mail por contato autorizado. Se preferir, responda para ajustar suas preferências.
    </p>
  </div>
</div>`.trim())

  const [formFilterTags, setFormFilterTags] = useState<string[]>([])
  const [formFilterStatus, setFormFilterStatus] = useState<string>('')
  const [formFilterSource, setFormFilterSource] = useState<string>('')
  const [formExcludeOptOut, setFormExcludeOptOut] = useState(true)
  const [formSendRate, setFormSendRate] = useState(10)
  const [formScheduleMode, setFormScheduleMode] = useState<'now' | 'schedule'>('now')
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [formAutomationEnabled, setFormAutomationEnabled] = useState(false)
  const [formAutomationTrigger, setFormAutomationTrigger] = useState<'OPEN' | 'CLICK' | 'BOTH'>('BOTH')
  const [formAutomationStageId, setFormAutomationStageId] = useState('')
  const [formFollowupSubject, setFormFollowupSubject] = useState('Dando continuidade ao seu interesse')
  const [formFollowupHtml, setFormFollowupHtml] = useState('<p>Percebemos seu interesse. Quer que eu te ajude com os próximos passos?</p>')

  const [preview, setPreview] = useState<{ total: number; contacts: { id: string; name: string; email: string }[] } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessageItem[]>([])
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesTotalPages, setMessagesTotalPages] = useState(1)
  const [messagesSearch, setMessagesSearch] = useState('')
  const [messagesEngagement, setMessagesEngagement] = useState<'ALL' | 'OPENED' | 'CLICKED' | 'FAILED'>('ALL')
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [followupSourceCampaignId, setFollowupSourceCampaignId] = useState('')
  const [followupName, setFollowupName] = useState('')
  const [followupSubject, setFollowupSubject] = useState('')
  const [followupHtml, setFollowupHtml] = useState('')

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

        const [tagsRes, campaignsRes, statRes, statusOptsRes, sourceOptsRes, stagesRes] = await Promise.allSettled([
          apiFetch(`${apiUrl}/api/contacts/tags`),
          apiFetch(`${apiUrl}/api/email-campaigns?limit=50`),
          apiFetch(`${apiUrl}/api/email-campaigns/stats`),
          apiFetch(`${apiUrl}/api/settings/field-options/customerStatus`),
          apiFetch(`${apiUrl}/api/settings/field-options/source`),
          apiFetch(`${apiUrl}/api/pipeline/stages`),
        ])

        // tags
        if (tagsRes.status === 'fulfilled' && tagsRes.value?.ok) {
          const data = await tagsRes.value.json()
          setAvailableTags(Array.isArray(data) ? data : [])
        } else {
          setAvailableTags([])
        }

        // status options
        if (statusOptsRes.status === 'fulfilled' && statusOptsRes.value?.ok) {
          const data = await statusOptsRes.value.json()
          setCustomerStatusOptions(Array.isArray(data) ? data : [])
        } else {
          setCustomerStatusOptions([])
        }

        // source options
        if (sourceOptsRes.status === 'fulfilled' && sourceOptsRes.value?.ok) {
          const data = await sourceOptsRes.value.json()
          setSourceOptions(Array.isArray(data) ? data : [])
        } else {
          setSourceOptions([])
        }

        // pipeline stages
        if (stagesRes.status === 'fulfilled' && stagesRes.value?.ok) {
          const data = await stagesRes.value.json()
          const stages = Array.isArray(data) ? data : []
          setPipelineStages(stages)
          if (!formAutomationStageId && stages.length > 0) {
            setFormAutomationStageId(stages[0].id)
          }
        } else {
          setPipelineStages([])
        }

        // campaigns
        if (campaignsRes.status === 'fulfilled' && campaignsRes.value?.ok) {
          const data = await campaignsRes.value.json()
          setCampaigns(data?.campaigns || [])
        } else {
          setCampaigns([])
        }

        // stats
        if (statRes.status === 'fulfilled' && statRes.value?.ok) {
          const data = await statRes.value.json()
          setStats(data || null)
        } else {
          setStats(null)
        }

        setPreview(null)
      } catch (e) {
        console.error('Erro ao carregar email marketing:', e)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      loadAll()
    }
  }, [status])

  useEffect(() => {
    if (!selectedCampaignId) return
    loadCampaignMessages(selectedCampaignId, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesEngagement])

  const refreshCampaigns = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const campaignsRes = await apiFetch(`${apiUrl}/api/email-campaigns?limit=50`)
    if (campaignsRes.ok) {
      const data = await campaignsRes.json()
      setCampaigns(data?.campaigns || [])
    }
    const statRes = await apiFetch(`${apiUrl}/api/email-campaigns/stats`)
    if (statRes.ok) {
      const data = await statRes.json()
      setStats(data || null)
    }
  }

  const loadCampaignMessages = async (campaignId: string, page = 1) => {
    if (!campaignId) return
    setMessagesLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (messagesSearch.trim()) params.set('search', messagesSearch.trim())
      if (messagesEngagement !== 'ALL') params.set('engagement', messagesEngagement)
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${campaignId}/messages?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao carregar mensagens da campanha')
      }
      const data = await res.json()
      setCampaignMessages(data?.messages || [])
      setMessagesPage(data?.pagination?.page || 1)
      setMessagesTotalPages(data?.pagination?.pages || 1)
    } catch (e: any) {
      alert(e?.message || 'Falha ao carregar mensagens')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleViewCampaignDetails = async (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    await loadCampaignMessages(campaignId, 1)
  }

  const handleReprocessFailed = async (campaignId: string) => {
    if (!confirm('Reprocessar apenas mensagens com falha desta campanha?')) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${campaignId}/reprocess-failed`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao reprocessar falhas')
      }
      const data = await res.json()
      alert(`Mensagens reprocessadas: ${data?.updated ?? 0}`)
      await refreshCampaigns()
      if (selectedCampaignId === campaignId) {
        await loadCampaignMessages(campaignId, 1)
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao reprocessar')
    }
  }

  const handleExportCsv = async (campaignId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${campaignId}/export.csv`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao exportar CSV')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `email-campaign-${campaignId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e?.message || 'Erro ao exportar CSV')
    }
  }

  const openFollowupModal = (campaign: EmailCampaign) => {
    setFollowupSourceCampaignId(campaign.id)
    setFollowupName(`Follow-up (abriu e não clicou) - ${campaign.name}`)
    setFollowupSubject(
      campaign.subject.toLowerCase().includes('lembrete') ? campaign.subject : `Lembrete: ${campaign.subject}`,
    )
    setFollowupHtml(
      `${campaign.htmlTemplate || formHtml}
<div style="font-family:Arial,sans-serif;max-width:680px;margin:14px auto 0;color:#64748b;font-size:12px;">
  <p>Percebemos que você abriu nosso e-mail anterior. Se quiser, é só clicar no botão acima para continuar.</p>
</div>`,
    )
    setFollowupModalOpen(true)
  }

  const handleCreateOpenedNotClickedFollowup = async () => {
    if (!followupSourceCampaignId) return
    if (!followupSubject.trim()) return alert('Assunto do follow-up é obrigatório')
    if (!followupHtml.trim()) return alert('HTML do follow-up é obrigatório')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${followupSourceCampaignId}/followup-opened-not-clicked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: followupName || undefined,
          subject: followupSubject,
          htmlTemplate: followupHtml,
          autoStart: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao criar follow-up')
      }
      const data = await res.json()
      alert(
        `Follow-up criado e iniciado.\nSegmento: ${data?.totalSegmentContacts ?? 0} contato(s)\nCampanha: ${data?.campaignId || '-'}`,
      )
      setFollowupModalOpen(false)
      await refreshCampaigns()
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar follow-up')
    }
  }

  const handleStartOrResumeCampaign = async (id: string) => {
    if (!confirm('Iniciar (ou retomar) o envio desta campanha?')) return
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${id}/start`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        alert(data?.totalContacts ? `Envio iniciado para ${data.totalContacts} destinatário(s). Os e-mails saem em background.` : 'Envio iniciado.')
        await refreshCampaigns()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.message || 'Erro ao iniciar envio')
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao iniciar')
    } finally {
      setSaving(false)
    }
  }

  const handlePauseCampaign = async (id: string) => {
    if (!confirm('Pausar o envio desta campanha?')) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${id}/pause`, { method: 'POST' })
      if (res.ok) {
        await refreshCampaigns()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.message || 'Erro ao pausar')
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao pausar')
    }
  }

  const handleUnscheduleCampaign = async (id: string) => {
    if (!confirm('Remover agendamento e voltar para rascunho?')) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${id}/unschedule`, { method: 'POST' })
      if (res.ok) {
        await refreshCampaigns()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.message || 'Erro ao remover agendamento')
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao remover agendamento')
    }
  }

  const handleCancelCampaign = async (id: string) => {
    if (!confirm('Cancelar esta campanha?')) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/${id}/cancel`, { method: 'POST' })
      if (res.ok) {
        await refreshCampaigns()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.message || 'Erro ao cancelar')
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao cancelar')
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreview(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/email-campaigns/preview-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterTags: formFilterTags.length > 0 ? formFilterTags : undefined,
          filterStatus: formFilterStatus || undefined,
          filterSource: formFilterSource || undefined,
          excludeOptOut: formExcludeOptOut,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Falha ao carregar preview')
      }

      const data = await res.json()
      setPreview(data)
    } catch (e: any) {
      alert(e?.message || 'Erro no preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleCreateAndStart = async () => {
    if (!formSubject.trim()) return alert('Assunto é obrigatório')
    if (!formHtml.trim()) return alert('HTML é obrigatório')
    if (!formName.trim()) return alert('Nome da campanha é obrigatório')
    if (formScheduleMode === 'schedule' && !formScheduledAt) return alert('Informe data/hora para agendar')
    if (formAutomationEnabled && !formAutomationStageId) {
      return alert('Selecione a etapa de destino da automação')
    }

    if (preview && preview.total === 0) {
      const ok = confirm('Preview está vazio. Ainda assim deseja enviar?')
      if (!ok) return
    }

    const ok = confirm(
      formScheduleMode === 'schedule'
        ? 'Criar e agendar esta campanha para o horário selecionado?'
        : 'Criar e iniciar o envio da campanha agora?',
    )
    if (!ok) return

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const customPayload = formAutomationEnabled
        ? {
            automation: {
              enabled: true,
              trigger: formAutomationTrigger,
              targetStageId: formAutomationStageId || undefined,
              followupSubject: formFollowupSubject || undefined,
              followupHtml: formFollowupHtml || undefined,
            },
          }
        : undefined

      const createRes = await apiFetch(`${apiUrl}/api/email-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          subject: formSubject,
          preheader: formPreheader || undefined,
          htmlTemplate: formHtml,
          filterTags: formFilterTags.length > 0 ? formFilterTags : undefined,
          filterStatus: formFilterStatus || undefined,
          filterSource: formFilterSource || undefined,
          filterCustomFields: customPayload,
          excludeOptOut: formExcludeOptOut,
          sendRatePerMinute: formSendRate,
          scheduledAt: formScheduleMode === 'schedule' ? formScheduledAt || undefined : undefined,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao criar campanha')
      }

      const created = await createRes.json()
      if (formScheduleMode === 'schedule') {
        alert('Campanha criada e agendada com sucesso.')
      } else {
        const startRes = await apiFetch(`${apiUrl}/api/email-campaigns/${created.id}/start`, {
          method: 'POST',
        })
        if (!startRes.ok) {
          const err = await startRes.json().catch(() => ({}))
          throw new Error(err?.message || 'Erro ao iniciar envio')
        }
        alert('Campanha criada e envio iniciado em background.')
      }
      // Recarregar
      await refreshCampaigns()
      setPreview(null)
    } catch (e: any) {
      alert(e?.message || 'Erro ao enviar')
    } finally {
      setSaving(false)
    }
  }

  const statusLabel = (st: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
      RUNNING: { bg: 'bg-green-100', text: 'text-green-700' },
      PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-700' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    }
    return map[st] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando Email Marketing...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">E-mail Marketing</h1>
              <p className="text-gray-500">Crie campanhas HTML e dispare via Gmail conectado ou SMTP.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refreshCampaigns()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold">{stats?.campaigns?.total ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Em execução</p>
                <p className="text-xl font-bold text-green-700">{stats?.campaigns?.running ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-700 font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Concluídas</p>
                <p className="text-xl font-bold text-purple-700">{stats?.campaigns?.completed ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-700 font-bold">⏸</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pausadas</p>
                <p className="text-xl font-bold text-yellow-700">{stats?.campaigns?.paused ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Funil de engajamento (e-mail)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Enviados</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.messages?.sent ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Entregues</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.messages?.delivered ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Abertos</p>
              <p className="text-xl font-semibold text-blue-700">{stats?.messages?.read ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Clicados</p>
              <p className="text-xl font-semibold text-green-700">{stats?.messages?.clicked ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Falhados</p>
              <p className="text-xl font-semibold text-red-700">{stats?.messages?.failed ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nova campanha</h2>
              <p className="text-sm text-gray-600 mt-1">
                Modo simples: escreva o HTML e envie. (Sem variáveis.)
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              Templates: <span className="font-semibold">HTML + inline CSS</span>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={simpleMode}
                onChange={(e) => setSimpleMode(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Modo simples (sem variáveis)
            </label>
            <p className="text-xs text-gray-500">
              Use CSS inline (estilo dentro de cada tag) para melhor compatibilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da campanha</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
              <input
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Preheader (opcional)</label>
              <input
                value={formPreheader}
                onChange={(e) => setFormPreheader(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML do e-mail (cole pronto, com inline CSS)
              </label>
              <textarea
                value={formHtml}
                onChange={(e) => setFormHtml(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500"
              />
              {!simpleMode && (
                <p className="text-xs text-gray-500 mt-2">
                  Obs.: variáveis ainda não estão habilitadas neste modo.
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-5 pt-5 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Filtros de destinatários</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.length === 0 ? (
                    <p className="text-sm text-gray-500">Sem tags carregadas</p>
                  ) : (
                    availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setFormFilterTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                          )
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formFilterTags.includes(tag)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))
                  )}
                </div>
                {formFilterTags.length > 0 && (
                  <p className="text-sm text-green-700 mt-2">✓ {formFilterTags.length} tag(s) selecionadas</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status do cliente</label>
                <select
                  value={formFilterStatus}
                  onChange={(e) => setFormFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todos</option>
                  {customerStatusOptions.map((opt) => (
                    <option key={opt.id} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                <select
                  value={formFilterSource}
                  onChange={(e) => setFormFilterSource(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todas</option>
                  {sourceOptions.map((opt) => (
                    <option key={opt.id} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formExcludeOptOut}
                  onChange={(e) => setFormExcludeOptOut(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Excluir opt-out</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">Velocidade</div>
                <select
                  value={formSendRate}
                  onChange={(e) => setFormSendRate(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value={5}>5 e-mails/min</option>
                  <option value={10}>10 e-mails/min</option>
                  <option value={20}>20 e-mails/min</option>
                  <option value={30}>30 e-mails/min</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Agendamento</h4>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={formScheduleMode === 'now'}
                    onChange={() => setFormScheduleMode('now')}
                  />
                  Enviar agora
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={formScheduleMode === 'schedule'}
                    onChange={() => setFormScheduleMode('schedule')}
                  />
                  Agendar
                </label>
                {formScheduleMode === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <input
                  type="checkbox"
                  checked={formAutomationEnabled}
                  onChange={(e) => setFormAutomationEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Automação de funil após engajamento (abertura/clique)
              </label>
              {formAutomationEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disparar automação quando</label>
                    <select
                      value={formAutomationTrigger}
                      onChange={(e) => setFormAutomationTrigger(e.target.value as 'OPEN' | 'CLICK' | 'BOTH')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="BOTH">Abrir ou clicar</option>
                      <option value="OPEN">Apenas abrir</option>
                      <option value="CLICK">Apenas clicar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mover para etapa do Pipeline</label>
                    <select
                      value={formAutomationStageId}
                      onChange={(e) => setFormAutomationStageId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      {pipelineStages.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assunto do follow-up</label>
                    <input
                      value={formFollowupSubject}
                      onChange={(e) => setFormFollowupSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">HTML do follow-up</label>
                    <textarea
                      rows={5}
                      value={formFollowupHtml}
                      onChange={(e) => setFormFollowupHtml(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Search className="h-4 w-4 text-gray-600" />
                {previewLoading ? 'Buscando...' : 'Preview'}
              </button>

              <button
                type="button"
                onClick={handleCreateAndStart}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {saving ? 'Processando...' : formScheduleMode === 'schedule' ? 'Criar e agendar' : 'Criar e enviar agora'}
              </button>
            </div>
          </div>

          {/* Preview results */}
          {preview && (
            <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                  <p className="text-sm text-gray-600">
                    Total de destinatários: <span className="font-semibold">{preview.total}</span>
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <p className="text-xs text-gray-500 mb-2">Amostra (até 100):</p>
                {preview.contacts.slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="truncate">{c.name || 'Sem nome'}</span>
                    <span className="text-gray-500 ml-3 text-right truncate">{c.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Campanhas recentes</h2>
          <p className="text-sm text-gray-600 mb-4">
            Campanhas podem ficar em <span className="font-semibold text-yellow-700">PAUSED</span> quando ocorre falha
            temporária de envio. Use <span className="font-semibold text-green-700">Retomar</span> para continuar os
            pendentes.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Assunto</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Agendado para</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Destinatários</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Enviados</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-3 text-gray-500">
                      Nenhuma campanha ainda.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => {
                    const st = statusLabel(c.status)
                    const canStart = c.status === 'DRAFT' || c.status === 'PAUSED' || c.status === 'SCHEDULED'
                    const canPause = c.status === 'RUNNING'
                    return (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-medium text-gray-900">{c.name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-3 py-1 rounded-full text-xs ${st.bg} ${st.text}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{c.subject}</td>
                        <td className="py-3 px-3 text-gray-600">
                          {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{c.totalContacts ?? 0}</td>
                        <td className="py-3 px-3 text-gray-600">{c.sentCount ?? 0}</td>
                        <td className="py-3 px-3">
                          {canStart && (
                            <button
                              type="button"
                              onClick={() => handleStartOrResumeCampaign(c.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              title={
                                c.status === 'PAUSED'
                                  ? 'Retomar envio'
                                  : c.status === 'SCHEDULED'
                                  ? 'Iniciar agora'
                                  : 'Iniciar envio'
                              }
                            >
                              <Play className="h-4 w-4" />
                              {c.status === 'PAUSED' ? 'Retomar' : c.status === 'SCHEDULED' ? 'Iniciar agora' : 'Enviar'}
                            </button>
                          )}
                          {canPause && (
                            <button
                              type="button"
                              onClick={() => handlePauseCampaign(c.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600"
                              title="Pausar envio"
                            >
                              <Pause className="h-4 w-4" />
                              Pausar
                            </button>
                          )}
                          {(c.status === 'COMPLETED' || c.status === 'CANCELLED') && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                          {c.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleUnscheduleCampaign(c.id)}
                              className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
                              title="Remover agendamento"
                            >
                              Remover agendamento
                            </button>
                          )}
                          {(c.status === 'RUNNING' || c.status === 'PAUSED' || c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                            <button
                              type="button"
                              onClick={() => handleCancelCampaign(c.id)}
                              className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                              title="Cancelar campanha"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleViewCampaignDetails(c.id)}
                            className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Ver detalhes"
                          >
                            Detalhes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReprocessFailed(c.id)}
                            className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200"
                            title="Reprocessar falhas"
                          >
                            Reprocessar falhas
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportCsv(c.id)}
                            className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                            title="Exportar CSV"
                          >
                            CSV
                          </button>
                          <button
                            type="button"
                            onClick={() => openFollowupModal(c)}
                            className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-100 text-violet-700 hover:bg-violet-200"
                            title="Criar follow-up para quem abriu e não clicou"
                          >
                            Follow-up (abriu e não clicou)
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {selectedCampaignId && (
            <div className="mt-5 border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="text-md font-semibold text-gray-900">Detalhes da campanha</h3>
                <div className="flex items-center gap-2">
                  <input
                    value={messagesSearch}
                    onChange={(e) => setMessagesSearch(e.target.value)}
                    placeholder="Buscar por nome/e-mail"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => loadCampaignMessages(selectedCampaignId, 1)}
                    className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    Buscar
                  </button>
                  <select
                    value={messagesEngagement}
                    onChange={(e) => setMessagesEngagement(e.target.value as 'ALL' | 'OPENED' | 'CLICKED' | 'FAILED')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ALL">Todos</option>
                    <option value="OPENED">Abertos</option>
                    <option value="CLICKED">Clicados</option>
                    <option value="FAILED">Falhados</option>
                  </select>
                </div>
              </div>

              {messagesLoading ? (
                <p className="text-sm text-gray-500">Carregando mensagens...</p>
              ) : campaignMessages.length === 0 ? (
                <p className="text-sm text-gray-500">Sem mensagens para este filtro.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Destinatário</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Status</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Abertura</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Cliques</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Erro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignMessages.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100">
                          <td className="py-2 px-2">
                            <div className="font-medium text-gray-900">{m.contactName || 'Sem nome'}</div>
                            <div className="text-xs text-gray-500">{m.contactEmail}</div>
                          </td>
                          <td className="py-2 px-2 text-gray-700">{m.status}</td>
                          <td className="py-2 px-2 text-gray-700">
                            {m.readAt ? new Date(m.readAt).toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="py-2 px-2 text-gray-700">{m.clickCount ?? 0}</td>
                          <td className="py-2 px-2 text-red-600 max-w-[300px] truncate" title={m.error || ''}>
                            {m.error || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <span>Página {messagesPage} de {messagesTotalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={messagesPage <= 1 || messagesLoading}
                    onClick={() => loadCampaignMessages(selectedCampaignId, messagesPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={messagesPage >= messagesTotalPages || messagesLoading}
                    onClick={() => loadCampaignMessages(selectedCampaignId, messagesPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {followupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Follow-up: abriu e não clicou</h3>
              <button
                type="button"
                onClick={() => setFollowupModalOpen(false)}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da campanha</label>
                <input
                  value={followupName}
                  onChange={(e) => setFollowupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input
                  value={followupSubject}
                  onChange={(e) => setFollowupSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML do follow-up</label>
                <textarea
                  rows={10}
                  value={followupHtml}
                  onChange={(e) => setFollowupHtml(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFollowupModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateOpenedNotClickedFollowup}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
              >
                Criar e iniciar follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

