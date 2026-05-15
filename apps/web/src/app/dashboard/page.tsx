'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Circle
} from 'lucide-react'

interface OnlineUser {
  userId: string
  name: string
  email: string
  role: string
  lastActivity: string
  isOnline: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState({
    totalContacts: 0,
    contactsThisWeek: 0,
    activeConversations: 0,
    unreadConversations: 0,
    messagesToday: 0,
    messagesThisWeek: 0,
    openDeals: 0,
    wonDeals: 0,
    totalRevenue: 0,
    // Campanhas
    campaignsRunning: 0,
    campaignsCompleted: 0,
    campaignsSent: 0,
    campaignsDelivered: 0,
    campaignsRead: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])
  const [agentSlaStats, setAgentSlaStats] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
    if (status === 'authenticated') {
      fetchStats()
      
      if (isAdmin) {
        fetchOnlineUsers()
        const interval = setInterval(fetchOnlineUsers, 30000)
        return () => clearInterval(interval)
      }
    }
  }, [status, isAdmin])

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/reports/dashboard`)
      
      if (response.ok) {
        const data = await response.json()
        
        setStats({
          totalContacts: data.summary?.totalContacts || 0,
          contactsThisWeek: data.summary?.contactsThisWeek || 0,
          activeConversations: data.summary?.activeConversations || 0,
          unreadConversations: data.summary?.unreadConversations || 0,
          messagesToday: data.summary?.messagesToday || 0,
          messagesThisWeek: data.summary?.messagesThisWeek || 0,
          openDeals: data.summary?.openDeals || 0,
          wonDeals: data.summary?.wonDeals || 0,
          totalRevenue: data.summary?.totalRevenue || 0,
          campaignsRunning: data.campaigns?.running || 0,
          campaignsCompleted: data.campaigns?.completed || 0,
          campaignsSent: data.campaigns?.messagesSent || 0,
          campaignsDelivered: data.campaigns?.messagesDelivered || 0,
          campaignsRead: data.campaigns?.messagesRead || 0,
        })
        
        setRecentActivity(data.recentActivity || [])
        setRecentContacts(data.recentContacts || [])
        setRecentCampaigns(data.recentCampaigns || [])
        setAgentSlaStats(data.agentSlaStats || [])
      } else {
        console.error('Erro na resposta:', response.status, await response.text())
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar stats:', error)
      setLoading(false)
    }
  }

  const fetchOnlineUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/users/online`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setOnlineUsers(data)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários online:', error)
    }
  }

  // Função para formatar tempo relativo
  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
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
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo de volta, {session?.user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contatos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
                {stats.contactsThisWeek > 0 && (
                  <p className="text-xs text-green-600">+{stats.contactsThisWeek} esta semana</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
                {stats.unreadConversations > 0 && (
                  <p className="text-xs text-red-600">{stats.unreadConversations} não lidas</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SLA por Consultor */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">SLA de Atendimentos Pendentes por Consultor</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultor
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1 align-middle"></span>Até 2h
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1 align-middle"></span>Até 4h
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1 align-middle"></span>Até 6h
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-block w-3 h-3 border border-gray-300 bg-white rounded-full mr-1 align-middle"></span>+6h
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pendentes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentSlaStats.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.agentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-700 bg-green-50/50">
                      {agent.green > 0 ? agent.green : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-yellow-700 bg-yellow-50/50">
                      {agent.yellow > 0 ? agent.yellow : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-red-700 bg-red-50/50">
                      {agent.red > 0 ? agent.red : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-600 bg-gray-50/50">
                      {agent.white > 0 ? agent.white : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 bg-gray-100/30">
                      {agent.total}
                    </td>
                  </tr>
                ))}
                {agentSlaStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nenhum atendimento aguardando resposta no momento. Muito bem!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Atividade Recente</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div key={activity.id + activity.type} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'message_in' ? 'bg-green-100' :
                        activity.type === 'message_out' ? 'bg-blue-100' :
                        activity.type === 'contact' ? 'bg-purple-100' :
                        activity.type === 'campaign' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {activity.type === 'message_in' && <MessageSquare className="h-4 w-4 text-green-600" />}
                        {activity.type === 'message_out' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'contact' && <Users className="h-4 w-4 text-purple-600" />}
                        {activity.type === 'campaign' && <CheckCircle className="h-4 w-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(activity.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>

          {/* Online Users (Admin only) or Quick Stats */}
          {isAdmin ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Usuários Online</h2>
                <span className="text-sm text-gray-500">{onlineUsers.length} online</span>
              </div>
              <div className="p-6">
                {onlineUsers.length > 0 ? (
                  <div className="space-y-3">
                    {onlineUsers.map((user) => (
                      <div key={user.userId} className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-700 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 text-green-500 fill-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.role === 'ADMIN' ? 'Administrador' : 'Agente'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(user.lastActivity).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Nenhum usuário online</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">Resumo</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mensagens Hoje</span>
                    <span className="text-sm font-medium text-gray-900">{stats.messagesToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mensagens (7 dias)</span>
                    <span className="text-sm font-medium text-gray-900">{stats.messagesThisWeek}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Campanhas Ativas</span>
                    <span className="text-sm font-medium text-blue-600">{stats.campaignsRunning}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Campanhas Concluídas</span>
                    <span className="text-sm font-medium text-green-600">{stats.campaignsCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Msgs Campanha Enviadas</span>
                    <span className="text-sm font-medium text-gray-900">{stats.campaignsSent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Msgs Campanha Entregues</span>
                    <span className="text-sm font-medium text-green-600">{stats.campaignsDelivered}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Novos Contatos e Campanhas Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Novos Contatos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Novos Contatos</h2>
            </div>
            <div className="p-6">
              {recentContacts.length > 0 ? (
                <div className="space-y-3">
                  {recentContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-medium text-sm">
                            {contact.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatTimeAgo(contact.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Nenhum contato recente</p>
                </div>
              )}
            </div>
          </div>

          {/* Campanhas Recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Campanhas Recentes</h2>
            </div>
            <div className="p-6">
              {recentCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                        <p className="text-xs text-gray-500">
                          {campaign.sent} enviadas • {campaign.delivered} entregues
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                        campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status === 'COMPLETED' ? 'Concluída' :
                         campaign.status === 'RUNNING' ? 'Em execução' :
                         campaign.status === 'PAUSED' ? 'Pausada' :
                         campaign.status === 'DRAFT' ? 'Rascunho' :
                         campaign.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Nenhuma campanha ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}