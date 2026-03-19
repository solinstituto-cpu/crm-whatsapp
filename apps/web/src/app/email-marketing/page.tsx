'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useRequirePermission } from '@/hooks/use-require-permission'
import { apiFetch } from '@/lib/api'
import { Megaphone, Mail, RefreshCw, Send, Search, Tag } from 'lucide-react'

type EmailCampaign = {
  id: string
  name: string
  description?: string
  status: string
  subject: string
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
  failedCount: number
  createdAt: string
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
  _count?: { messages: number }
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

  const [preview, setPreview] = useState<{ total: number; contacts: { id: string; name: string; email: string }[] } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

        const [tagsRes, campaignsRes, statRes, statusOptsRes, sourceOptsRes] = await Promise.all([
          apiFetch(`${apiUrl}/api/contacts/tags`),
          apiFetch(`${apiUrl}/api/email-campaigns?limit=50`),
          apiFetch(`${apiUrl}/api/email-campaigns/stats`),
          apiFetch(`${apiUrl}/api/settings/field-options/customerStatus`),
          apiFetch(`${apiUrl}/api/settings/field-options/source`),
        ])

        // tags
        if (tagsRes?.ok) {
          const data = await tagsRes.json()
          setAvailableTags(Array.isArray(data) ? data : [])
        }

        // status options
        if (statusOptsRes?.ok) {
          const data = await statusOptsRes.json()
          setCustomerStatusOptions(Array.isArray(data) ? data : [])
        }

        // source options
        if (sourceOptsRes?.ok) {
          const data = await sourceOptsRes.json()
          setSourceOptions(Array.isArray(data) ? data : [])
        }

        // campaigns
        if (campaignsRes?.ok) {
          const data = await campaignsRes.json()
          setCampaigns(data?.campaigns || [])
        }

        // stats
        if (statRes?.ok) {
          const data = await statRes.json()
          setStats(data || null)
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

    if (preview && preview.total === 0) {
      const ok = confirm('Preview está vazio. Ainda assim deseja enviar?')
      if (!ok) return
    }

    const ok = confirm('Criar e iniciar o envio da campanha agora?')
    if (!ok) return

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
          excludeOptOut: formExcludeOptOut,
          sendRatePerMinute: formSendRate,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao criar campanha')
      }

      const created = await createRes.json()

      const startRes = await apiFetch(`${apiUrl}/api/email-campaigns/${created.id}/start`, {
        method: 'POST',
      })
      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}))
        throw new Error(err?.message || 'Erro ao iniciar envio')
      }

      alert('Campanha criada e envio iniciado em background.')
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
              <p className="text-gray-500">Crie campanhas HTML e dispare via SMTP (Gmail/Hostgator).</p>
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
                {saving ? 'Enviando...' : 'Criar e enviar agora'}
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

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Assunto</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Destinatários</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Enviados</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-3 text-gray-500">
                      Nenhuma campanha ainda.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => {
                    const st = statusLabel(c.status)
                    return (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-medium text-gray-900">{c.name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-3 py-1 rounded-full text-xs ${st.bg} ${st.text}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{c.subject}</td>
                        <td className="py-3 px-3 text-gray-600">{c.totalContacts ?? 0}</td>
                        <td className="py-3 px-3 text-gray-600">{c.sentCount ?? 0}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

