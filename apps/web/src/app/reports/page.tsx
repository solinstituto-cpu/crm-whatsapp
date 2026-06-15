'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getApiUrl } from '@/lib/api-config'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  DollarSign,
  Download,
  RefreshCw,
  ChevronDown
} from 'lucide-react'

// Tipos
interface Metrics {
  totalContacts: number
  contactsGrowth: number
  contactsInPeriod: number
  totalConversations: number
  conversationsGrowth: number
  conversationsInPeriod: number
  totalRevenue: number
  revenueInPeriod: number
  revenueGrowth: number
  conversionRate: number
  conversionGrowth: number
}

interface ChartData {
  labels: string[]
  conversations: number[]
  messages: number[]
}

interface TopContact {
  id: string
  name: string
  phone: string
  messageCount: number
  revenue: number
  rank: number
}

interface ActivityRow {
  period: string
  contacts: number
  messages: number
  deals: number
  revenue: number
}

// Garantir que API_URL sempre tenha /api no final
const getReportsApiUrl = () => {
  const url = getApiUrl()
  if (!url) return '/api'
  return url.endsWith('/api') ? url : `${url}/api`
}
const API_URL = getReportsApiUrl()

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // Estados dos dados
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [topContacts, setTopContacts] = useState<TopContact[]>([])
  const [activityData, setActivityData] = useState<ActivityRow[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const periods = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'month', label: 'Este mês' },
    { value: 'custom', label: 'Personalizado' }
  ]

  const exportTypes = [
    { value: 'all', label: 'Tudo' },
    { value: 'contacts', label: 'Apenas Contatos' },
    { value: 'conversations', label: 'Apenas Conversas' },
    { value: 'deals', label: 'Apenas Vendas' },
    { value: 'metrics', label: 'Apenas Métricas' },
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: selectedPeriod })
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        params.set('startDate', customStartDate)
        params.set('endDate', customEndDate)
      }

      const [metricsRes, chartRes, topContactsRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/reports/metrics?${params}`),
        fetch(`${API_URL}/reports/chart/conversations?${params}`),
        fetch(`${API_URL}/reports/top-contacts?${params}`),
        fetch(`${API_URL}/reports/activity`),
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data)
      }

      if (chartRes.ok) {
        const data = await chartRes.json()
        setChartData(data)
      }

      if (topContactsRes.ok) {
        const data = await topContactsRes.json()
        setTopContacts(data)
      }

      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivityData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, customStartDate, customEndDate])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleExport = async (type: string) => {
    const params = new URLSearchParams({ type, period: selectedPeriod })
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      params.set('startDate', customStartDate)
      params.set('endDate', customEndDate)
    }

    window.open(`${API_URL}/reports/export?${params}`, '_blank')
    setShowExportMenu(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calcular max para o gráfico
  const chartMax = chartData ? Math.max(...chartData.conversations, ...chartData.messages, 1) : 1

  if (status === 'loading' || (loading && !metrics)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="mr-3 h-8 w-8 text-green-600" />
                Relatórios
              </h1>
              <p className="text-gray-600 mt-1">Análise de desempenho do seu CRM</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Período */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>

              {/* Datas Personalizadas */}
              {selectedPeriod === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Botão Atualizar */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Botão Exportar */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    {exportTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handleExport(type.value)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Métricas (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Contatos */}
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contatos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics?.totalContacts || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {(metrics?.contactsGrowth || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                (metrics?.contactsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(metrics?.contactsGrowth || 0)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
            </div>
          </div>

          {/* Conversas */}
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics?.totalConversations || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {(metrics?.conversationsGrowth || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                (metrics?.conversationsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(metrics?.conversationsGrowth || 0)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
            </div>
          </div>

          {/* Receita */}
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(metrics?.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {(metrics?.revenueGrowth || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                (metrics?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(metrics?.revenueGrowth || 0)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics?.conversionRate || 0}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {(metrics?.conversionGrowth || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                (metrics?.conversionGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(metrics?.conversionGrowth || 0)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
            </div>
          </div>
        </div>

        {/* Gráficos e Top Contatos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Conversas por Dia */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Conversas por Dia</h3>
            </div>
            <div className="p-6">
              {chartData && chartData.labels.length > 0 ? (
                <div className="space-y-4">
                  {/* Legenda */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-600">Conversas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-600">Mensagens</span>
                    </div>
                  </div>
                  
                  {/* Gráfico de Barras Simples */}
                  <div className="h-64 flex items-end gap-1">
                    {chartData.labels.map((label, index) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1">
                        {/* Barras */}
                        <div className="w-full flex gap-0.5 items-end h-52">
                          <div
                            className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                            style={{ 
                              height: `${(chartData.conversations[index] / chartMax) * 100}%`,
                              minHeight: chartData.conversations[index] > 0 ? '4px' : '0'
                            }}
                            title={`${chartData.conversations[index]} conversas`}
                          />
                          <div
                            className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                            style={{ 
                              height: `${(chartData.messages[index] / chartMax) * 100}%`,
                              minHeight: chartData.messages[index] > 0 ? '4px' : '0'
                            }}
                            title={`${chartData.messages[index]} mensagens`}
                          />
                        </div>
                        {/* Label */}
                        <span className="text-xs text-gray-500 transform -rotate-45 origin-left whitespace-nowrap">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum dado disponível para o período</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Contatos */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Top Contatos</h3>
            </div>
            <div className="p-6">
              {topContacts.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto">
                  {topContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.messageCount} mensagens</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(contact.revenue)}
                        </p>
                        <p className="text-xs text-green-600 font-medium">#{contact.rank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum contato com atividade no período</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Atividade por Período */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Atividade por Período</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Novos Contatos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mensagens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Deals Fechados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Receita
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activityData.length > 0 ? (
                  activityData.map((row, index) => (
                    <tr key={row.period} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {row.contacts}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.messages.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row.deals}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Carregando dados de atividade...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
