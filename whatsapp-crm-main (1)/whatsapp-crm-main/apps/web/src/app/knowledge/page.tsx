'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  keywords: string
  category: string
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function KnowledgePage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  
  // Modal de edição
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    keywords: '',
    category: '',
    priority: 0
  })
  
  // Expandir/colapsar itens
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems()
      fetchCategories()
    }
  }, [status])

  const fetchItems = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/knowledge`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Erro ao carregar base de conhecimento:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/knowledge/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Título e conteúdo são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const url = editingItem 
        ? `${apiUrl}/api/knowledge/${editingItem.id}`
        : `${apiUrl}/api/knowledge`
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchItems()
        fetchCategories()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/knowledge/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchItems()
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/knowledge/${id}/toggle`, {
        method: 'PUT'
      })

      if (response.ok) {
        fetchItems()
      }
    } catch (error) {
      console.error('Erro ao alternar:', error)
    }
  }

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      content: item.content,
      keywords: item.keywords,
      category: item.category || '',
      priority: item.priority
    })
    setShowModal(true)
  }

  const openNewModal = () => {
    setEditingItem(null)
    resetForm()
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      keywords: '',
      category: '',
      priority: 0
    })
    setEditingItem(null)
  }

  // Filtrar itens
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Agrupar por categoria
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'Sem categoria'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, KnowledgeItem[]>)

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-7 w-7 mr-2 text-green-600" />
              Base de Conhecimento
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Informações que a IA usará para responder seus clientes
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conhecimento
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-6 w-6 text-violet-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-800">Como funciona?</h3>
              <p className="text-sm text-violet-600 mt-1">
                Quando um cliente fizer uma pergunta, a IA vai buscar automaticamente as informações 
                mais relevantes desta base para dar respostas precisas. Adicione FAQs, preços, 
                horários, serviços e qualquer informação útil.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Conhecimentos */}
        <div className="space-y-4">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum conhecimento cadastrado</h3>
              <p className="text-gray-500 mb-4">
                Adicione informações para que a IA possa responder seus clientes com precisão
              </p>
              <button
                onClick={openNewModal}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Adicionar primeiro conhecimento
              </button>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-500" />
                    {category}
                    <span className="ml-2 text-sm text-gray-500">({categoryItems.length})</span>
                  </h3>
                </div>
                <div className="divide-y">
                  {categoryItems.map(item => (
                    <div key={item.id} className={`${!item.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                      <div 
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {expandedItem === item.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            {item.keywords && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Keywords: {item.keywords}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <span className={`text-xs px-2 py-1 rounded ${item.priority > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            Prioridade: {item.priority}
                          </span>
                          <button
                            onClick={() => handleToggle(item.id)}
                            className={`p-1 rounded ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}
                            title={item.isActive ? 'Ativo' : 'Inativo'}
                          >
                            {item.isActive ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {expandedItem === item.id && (
                        <div className="px-4 pb-4 pt-0 ml-7">
                          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                            {item.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingItem ? 'Editar Conhecimento' : 'Novo Conhecimento'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título / Assunto *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Preços dos pacotes, Horários de funcionamento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    placeholder="Escreva todas as informações relevantes sobre este assunto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seja detalhado. Inclua todas as informações que a IA pode precisar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Preços, Serviços, FAQ"
                      list="categories"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <datalist id="categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maior = mais importante (0-10)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palavras-chave (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="preço, valor, quanto custa, pacote"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ajudam a IA encontrar este conhecimento quando cliente perguntar
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 p-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title.trim() || !formData.content.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
