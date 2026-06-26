'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getApiUrl } from '@/lib/api-config'
import { apiFetch } from '@/lib/api'
import { fetchUserWhatsAppAccounts } from '@/lib/whatsapp-accounts'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Users, 
  MessageSquare, 
  Phone,
  Clock,
  ChevronDown,
  RefreshCw,
  UserPlus,
  Send,
  AlertCircle,
  Calendar,
} from 'lucide-react'

interface OperatorStat {
  operatorId: string
  operatorName: string
  operatorColor: string
  newCount: number
  reengagementCount: number
  total: number
}

interface WaitingClient {
  conversationId: string
  contactName: string
  phone: string
  operatorName: string
  waitingSince: string
  waitingMinutes: number
}

interface DashboardData {
  summary: {
    totalNew: number
    totalReengagement: number
    totalWaiting: number
  }
  operatorStats: OperatorStat[]
  waitingClients: WaitingClient[]
  period: {
    start: string
    end: string
  }
  generatedAt: string
}

interface WhatsAppAccountOption {
  id: string
  name: string
  phoneNumber: string
  isDefault: boolean
}

type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getPresetDates(preset: PeriodPreset): { startDate: string; endDate: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return { startDate: formatDate(today), endDate: formatDate(today) }
    case '7d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 7)
      return { startDate: formatDate(start), endDate: formatDate(today) }
    }
    case '30d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 30)
      return { startDate: formatDate(start), endDate: formatDate(today) }
    }
    case 'month':
      return { startDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: formatDate(today) }
    case 'custom':
    default:
      return { startDate: formatDate(today), endDate: formatDate(today) }
  }
}

function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return `${hours}h ${mins}min`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return `${days}d ${remainHours}h`
}

function getWaitTimeColor(minutes: number): string {
  if (minutes <= 30) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30'
  if (minutes <= 60) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30'
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filtros
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccountOption[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [showAccountFilter, setShowAccountFilter] = useState(false)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('today')
  const [customStartDate, setCustomStartDate] = useState<string>(formatDate(new Date()))
  const [customEndDate, setCustomEndDate] = useState<string>(formatDate(new Date()))

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
    if (status === 'authenticated') {
      loadAccounts()
    }
  }, [status])

  const loadAccounts = async () => {
    const userId = (session?.user as any)?.id
    try {
      const accounts = await fetchUserWhatsAppAccounts(userId)
      setWhatsappAccounts(accounts)
      // Se só tem 1 conta, seleciona automaticamente
      if (accounts.length === 1) {
        setSelectedAccountId(accounts[0].id)
      }
    } catch (e) {
      console.error('Erro ao carregar contas:', e)
    }
  }

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const apiUrl = getApiUrl()
      const { startDate, endDate } = periodPreset === 'custom' 
        ? { startDate: customStartDate, endDate: customEndDate }
        : getPresetDates(periodPreset)

      const params = new URLSearchParams()
      if (selectedAccountId) params.set('accountId', selectedAccountId)
      params.set('startDate', startDate)
      params.set('endDate', endDate)

      const res = await apiFetch(`${apiUrl}/api/reports/dashboard-accounts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      } else {
        console.error('Erro ao buscar dashboard:', res.status)
      }
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedAccountId, periodPreset, customStartDate, customEndDate])

  // Buscar dados ao alterar filtros
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard()
    }
  }, [fetchDashboard, status])

  // Auto-refresh a cada 60s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const summary = dashboardData?.summary || { totalNew: 0, totalReengagement: 0, totalWaiting: 0 }
  const operatorStats = dashboardData?.operatorStats || []
  const waitingClients = dashboardData?.waitingClients || []

  const periodLabels: Record<PeriodPreset, string> = {
    today: 'Hoje',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    month: 'Este mês',
    custom: 'Personalizado',
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* ===== CABEÇALHO + FILTROS ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Dashboard de Atendimento</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Métricas de atendimento por número WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* ===== FILTROS ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Seletor de Conta WhatsApp */}
            {whatsappAccounts.length > 0 && (
              <div className="relative min-w-[220px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Conta WhatsApp</label>
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
                      onClick={() => { setSelectedAccountId(''); setShowAccountFilter(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !selectedAccountId ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span>Todas as Contas</span>
                    </button>
                    {whatsappAccounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => { setSelectedAccountId(account.id); setShowAccountFilter(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedAccountId === account.id ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{account.phoneNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Seletor de Período */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Período</label>
              <div className="flex flex-wrap gap-1">
                {(Object.entries(periodLabels) as [PeriodPreset, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPeriodPreset(key)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      periodPreset === key
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datas personalizadas */}
            {periodPreset === 'custom' && (
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">De</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Até</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== CARDS DE RESUMO ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Atendimentos Novos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Atendimentos Novos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalNew}</p>
                <p className="text-xs text-gray-400 mt-1">Clientes que nos procuraram</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Reengajamentos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reengajamentos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalReengagement}</p>
                <p className="text-xs text-gray-400 mt-1">Retomadas via template</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Send className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Clientes Esperando */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl border p-5 ${
            summary.totalWaiting > 0 
              ? 'border-red-200 dark:border-red-700 ring-1 ring-red-100 dark:ring-red-900/30' 
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Esperando Atendimento</p>
                <p className={`text-3xl font-bold mt-1 ${
                  summary.totalWaiting > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                }`}>{summary.totalWaiting}</p>
                <p className="text-xs text-gray-400 mt-1">Aguardando resposta agora</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                summary.totalWaiting > 0 
                  ? 'bg-red-50 dark:bg-red-900/30' 
                  : 'bg-green-50 dark:bg-green-900/30'
              }`}>
                {summary.totalWaiting > 0 
                  ? <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  : <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                }
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABELA DE OPERADORES ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Atendimentos por Operador
            </h2>
          </div>
          
          {operatorStats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum atendimento encontrado no período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Operador</th>
                    <th className="px-5 py-3 text-center">Novos</th>
                    <th className="px-5 py-3 text-center">Reengajamentos</th>
                    <th className="px-5 py-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {operatorStats.map((op) => (
                    <tr key={op.operatorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: op.operatorColor }}
                          >
                            {op.operatorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{op.operatorName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                          {op.newCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
                          {op.reengagementCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                          {op.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Linha de totais */}
                  <tr className="bg-gray-50 dark:bg-gray-700/30 font-bold">
                    <td className="px-5 py-3 text-gray-900 dark:text-white">Total</td>
                    <td className="px-5 py-3 text-center text-blue-700 dark:text-blue-300">{summary.totalNew}</td>
                    <td className="px-5 py-3 text-center text-purple-700 dark:text-purple-300">{summary.totalReengagement}</td>
                    <td className="px-5 py-3 text-center text-green-700 dark:text-green-300">{summary.totalNew + summary.totalReengagement}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== TABELA DE CLIENTES ESPERANDO ===== */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl border ${
          waitingClients.length > 0 
            ? 'border-red-200 dark:border-red-700' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Clientes Esperando Atendimento
              {waitingClients.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                  {waitingClients.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">Atualiza automaticamente a cada 60s</p>
          </div>
          
          {waitingClients.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-green-600 dark:text-green-400 font-medium">Nenhum cliente esperando! 🎉</p>
              <p className="text-xs mt-1">Todos os clientes foram atendidos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Cliente</th>
                    <th className="px-5 py-3 text-left">Telefone</th>
                    <th className="px-5 py-3 text-left">Operador</th>
                    <th className="px-5 py-3 text-center">Tempo de Espera</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {waitingClients.map((client) => (
                    <tr key={client.conversationId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">{client.contactName}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {client.phone}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {client.operatorName}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg ${getWaitTimeColor(client.waitingMinutes)}`}>
                          <Clock className="h-3 w-3" />
                          {formatWaitTime(client.waitingMinutes)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé com timestamp */}
        {dashboardData?.generatedAt && (
          <p className="text-xs text-gray-400 text-center">
            Última atualização: {new Date(dashboardData.generatedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}