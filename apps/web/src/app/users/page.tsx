'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useRequirePermission } from '@/hooks/use-require-permission'
import { apiFetch } from '@/lib/api'
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Shield, 
  User as UserIcon,
  Mail,
  Lock,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  color?: string
  createdAt: string
  isOnline?: boolean
  lastActivity?: string
}

// Função para formatar última atividade
const formatLastActivity = (lastActivity: string) => {
  const date = new Date(lastActivity)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora mesmo'
  if (diffMins < 60) return `há ${diffMins} min`
  if (diffHours < 24) return `há ${diffHours}h`
  if (diffDays === 1) return 'ontem às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays < 7) return `há ${diffDays} dias`
  return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  useRequirePermission('users')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'AGENT',
    color: '#3B82F6'
  })
  
  // Alert state
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchUsers()
    // Atualizar lista a cada 30 segundos para mostrar status online/offline atualizado
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await apiFetch(`${apiUrl}/api/users`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setUsers(data)
        } else if (data.message === 'Acesso negado') {
          setAlert({ type: 'error', message: 'Apenas administradores podem acessar esta página' })
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setAlert({ type: 'error', message: 'Erro ao carregar usuários' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        color: user.color || '#3B82F6'
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'AGENT',
        color: '#3B82F6'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'AGENT', color: '#3B82F6' })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setAlert({ type: 'error', message: 'Nome e email são obrigatórios' })
      return
    }

    if (!editingUser && !formData.password) {
      setAlert({ type: 'error', message: 'Senha é obrigatória para novos usuários' })
      return
    }

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      
      // Se estiver editando, primeiro atualizar a cor (endpoint separado, sem precisar de admin)
      if (editingUser && formData.color !== editingUser.color) {
        await apiFetch(`${apiUrl}/api/users/${editingUser.id}/color`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color: formData.color })
        })
      }
      
      const url = editingUser 
        ? `${apiUrl}/api/users/${editingUser.id}`
        : `${apiUrl}/api/users`
      
      const method = editingUser ? 'PUT' : 'POST'
      
      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      }
      
      if (formData.password) {
        body.password = formData.password
      }

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': session?.user?.email || ''
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!' 
        })
        handleCloseModal()
        fetchUsers()
      } else {
        const error = await response.json()
        setAlert({ type: 'error', message: error.message || 'Erro ao salvar usuário' })
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setAlert({ type: 'error', message: 'Erro ao salvar usuário' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
      const response = await apiFetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': session?.user?.email || ''
        }
      })

      if (response.ok) {
        setAlert({ type: 'success', message: 'Usuário excluído com sucesso!' })
        setDeleteConfirm(null)
        fetchUsers()
      } else {
        const error = await response.json()
        setAlert({ type: 'error', message: error.message || 'Erro ao excluir usuário' })
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      setAlert({ type: 'error', message: 'Erro ao excluir usuário' })
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Alert */}
        {alert && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {alert.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3 h-7 w-7 text-green-600" />
              Gerenciar Usuários
            </h1>
            <p className="text-gray-600 mt-1">Crie e gerencie os usuários do sistema</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Usuário
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-800">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'SUPERVISOR'
                            ? 'bg-orange-100 text-orange-800'
                            : user.role === 'VIEWER'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'ADMIN' && (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        )}
                        {user.role === 'SUPERVISOR' && (
                          <>
                            <UserIcon className="h-3 w-3 mr-1" />
                            Supervisor
                          </>
                        )}
                        {user.role === 'AGENT' && (
                          <>
                            <UserIcon className="h-3 w-3 mr-1" />
                            Atendente
                          </>
                        )}
                        {user.role === 'VIEWER' && (
                          <>
                            <UserIcon className="h-3 w-3 mr-1" />
                            Visualizador
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isOnline 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${
                            user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}></span>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                        {user.lastActivity && (
                          <span className="text-xs text-gray-400 mt-1">
                            {user.isOnline 
                              ? 'Ativo agora' 
                              : `Saiu ${formatLastActivity(user.lastActivity)}`
                            }
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {deleteConfirm === user.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">Confirmar?</span>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Confirmar exclusão"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {editingUser ? '(deixe vazio para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? '••••••••' : 'Senha'}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Função */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                  >
                    <option value="AGENT">Atendente</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === 'ADMIN' && 'Acesso total ao sistema'}
                    {formData.role === 'SUPERVISOR' && 'Gerencia atendentes e visualiza relatórios'}
                    {formData.role === 'AGENT' && 'Realiza atendimentos aos clientes'}
                    {formData.role === 'VIEWER' && 'Apenas visualiza informações'}
                  </p>
                </div>

                {/* Cor de identificação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor de Identificação
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <div 
                      className="flex-1 h-10 rounded-lg border border-gray-200 flex items-center px-3"
                      style={{ backgroundColor: formData.color + '20' }}
                    >
                      <span 
                        className="w-6 h-6 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: formData.color }}
                      />
                      <span className="text-sm text-gray-600">
                        Preview do badge no inbox
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Esta cor será usada para identificar o atendente nas conversas
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {editingUser ? 'Salvar' : 'Criar Usuário'}
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
