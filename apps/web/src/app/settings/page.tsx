'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useRequirePermission } from '@/hooks/use-require-permission'
import { apiFetch } from '@/lib/api'
import { useTheme, colorMap } from '@/lib/theme-context'
import { 
  Settings,
  Save,
  MessageSquare,
  Key,
  Users,
  Smartphone,
  Globe,
  Shield,
  Bell,
  Palette,
  List,
  Plus,
  Edit,
  Trash2,
  X,
  Sun,
  Moon,
  Monitor,
  Check,
  Type,
  Layout,
  Zap,
  Loader2,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  Plug,
  Bot,
  Table,
  TestTube,
  Mail,
  Eye,
  EyeOff,
  ExternalLink,
  UserCog
} from 'lucide-react'

// Componente de Configurações de Aparência
function AppearanceSettings() {
  const { config, setTheme, setPrimaryColor, setFontSize, setDensity, setCustomColor } = useTheme()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColorValue, setCustomColorValue] = useState(config.customColor || '#16a34a')

  const themes = [
    { value: 'light' as const, label: 'Claro', icon: Sun, preview: 'bg-white' },
    { value: 'dark' as const, label: 'Escuro', icon: Moon, preview: 'bg-gray-800' },
    { value: 'auto' as const, label: 'Automático', icon: Monitor, preview: 'bg-gradient-to-r from-white to-gray-800' },
  ]

  const colors = [
    { value: 'green' as const, label: 'Verde', class: 'bg-green-500' },
    { value: 'blue' as const, label: 'Azul', class: 'bg-blue-500' },
    { value: 'purple' as const, label: 'Roxo', class: 'bg-purple-500' },
    { value: 'red' as const, label: 'Vermelho', class: 'bg-red-500' },
    { value: 'orange' as const, label: 'Laranja', class: 'bg-orange-500' },
    { value: 'indigo' as const, label: 'Índigo', class: 'bg-indigo-500' },
    { value: 'pink' as const, label: 'Rosa', class: 'bg-pink-500' },
    { value: 'teal' as const, label: 'Teal', class: 'bg-teal-500' },
    { value: 'cyan' as const, label: 'Ciano', class: 'bg-cyan-500' },
    { value: 'amber' as const, label: 'Âmbar', class: 'bg-amber-500' },
    { value: 'emerald' as const, label: 'Esmeralda', class: 'bg-emerald-500' },
    { value: 'rose' as const, label: 'Rosé', class: 'bg-rose-500' },
  ]

  const fontSizes = [
    { value: 'small' as const, label: 'Pequeno', size: '14px' },
    { value: 'medium' as const, label: 'Médio', size: '16px' },
    { value: 'large' as const, label: 'Grande', size: '18px' },
  ]

  const densities = [
    { value: 'compact' as const, label: 'Compacto', description: 'Mais conteúdo na tela' },
    { value: 'comfortable' as const, label: 'Confortável', description: 'Equilíbrio entre espaço e conteúdo' },
    { value: 'spacious' as const, label: 'Espaçoso', description: 'Mais espaço entre elementos' },
  ]
  
  const handleCustomColorApply = () => {
    if (setCustomColor) {
      setCustomColor(customColorValue)
    }
    setShowColorPicker(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aparência</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Personalize a aparência do sistema</p>
      </div>

      <div className="space-y-8">
        {/* Tema */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Tema
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((theme) => {
              const Icon = theme.icon
              const isSelected = config.theme === theme.value
              return (
                <button
                  key={theme.value}
                  onClick={() => setTheme(theme.value)}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-primary-dynamic bg-primary-light-dynamic' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  style={isSelected ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' } : {}}
                >
                  <div className={`w-full h-16 ${theme.preview} rounded-md mb-3 border border-gray-200 dark:border-gray-600`}></div>
                  <div className="flex items-center justify-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-primary-dynamic' : 'text-gray-500'}`} style={isSelected ? { color: 'var(--color-primary)' } : {}} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary-dynamic' : 'text-gray-700 dark:text-gray-300'}`} style={isSelected ? { color: 'var(--color-primary)' } : {}}>
                      {theme.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cor Principal */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor Principal
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {colors.map((color) => {
              const isSelected = config.primaryColor === color.value
              return (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`relative w-12 h-12 ${color.class} rounded-lg cursor-pointer transition-all hover:scale-110 hover:shadow-lg ${
                    isSelected ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600' : ''
                  }`}
                  title={color.label}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              )
            })}
            
            {/* Botão para cor personalizada */}
            <button
              onClick={() => setShowColorPicker(true)}
              className={`relative w-12 h-12 rounded-lg cursor-pointer transition-all hover:scale-110 hover:shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ${
                config.primaryColor === 'custom' ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600' : ''
              }`}
              style={config.primaryColor === 'custom' ? { backgroundColor: config.customColor || '#16a34a' } : {}}
              title="Cor personalizada"
            >
              {config.primaryColor === 'custom' ? (
                <Check className="h-5 w-5 text-white drop-shadow-md" />
              ) : (
                <Plus className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Modal do seletor de cor */}
          {showColorPicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 shadow-xl">
                <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Escolher Cor</h4>
                
                <div className="space-y-4">
                  {/* Color picker nativo */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={customColorValue}
                      onChange={(e) => setCustomColorValue(e.target.value)}
                      className="w-20 h-20 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código Hex
                      </label>
                      <input
                        type="text"
                        value={customColorValue}
                        onChange={(e) => setCustomColorValue(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div 
                    className="w-full h-12 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: customColorValue }}
                  >
                    Prévia da cor
                  </div>
                  
                  {/* Cores rápidas */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Cores populares:</p>
                    <div className="flex flex-wrap gap-2">
                      {['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCustomColorValue(c)}
                          className="w-8 h-8 rounded-full hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCustomColorApply}
                    className="flex-1 px-4 py-2 text-white rounded-lg"
                    style={{ backgroundColor: customColorValue }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Cor selecionada: <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
              {config.primaryColor === 'custom' ? config.customColor : colors.find(c => c.value === config.primaryColor)?.label}
            </span>
          </p>
        </div>

        {/* Tamanho da Fonte */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Type className="h-4 w-4" />
            Tamanho da Fonte
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {fontSizes.map((size) => {
              const isSelected = config.fontSize === size.value
              return (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary-dynamic bg-primary-light-dynamic' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  style={isSelected ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' } : {}}
                >
                  <div className="text-center">
                    <span 
                      className={`font-medium ${isSelected ? '' : 'text-gray-700 dark:text-gray-300'}`}
                      style={{ fontSize: size.size, color: isSelected ? 'var(--color-primary)' : undefined }}
                    >
                      Aa
                    </span>
                    <p className={`text-xs mt-1 ${isSelected ? '' : 'text-gray-500'}`} style={isSelected ? { color: 'var(--color-primary-dark)' } : {}}>
                      {size.label}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Densidade */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Densidade do Layout
          </h3>
          <div className="space-y-3">
            {densities.map((density) => {
              const isSelected = config.density === density.value
              return (
                <button
                  key={density.value}
                  onClick={() => setDensity(density.value)}
                  className={`w-full text-left border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary-dynamic bg-primary-light-dynamic' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  style={isSelected ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${isSelected ? '' : 'text-gray-700 dark:text-gray-300'}`} style={isSelected ? { color: 'var(--color-primary)' } : {}}>
                        {density.label}
                      </span>
                      <p className={`text-xs mt-0.5 ${isSelected ? '' : 'text-gray-500'}`} style={isSelected ? { color: 'var(--color-primary-dark)' } : {}}>
                        {density.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-6 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Prévia</h3>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
                A
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Exemplo de Contato</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">+55 11 99999-9999</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Botão Primário
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-medium border-2 transition-colors"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                Botão Secundário
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Configurações de Integrações (OpenAI, Google Sheets, etc)
function IntegrationsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null)
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean, email?: string | null } | null>(null)
  const [gmailTestTo, setGmailTestTo] = useState('')
  
  // OpenAI Config
  const [showApiKey, setShowApiKey] = useState(false)
  const [openAIConfig, setOpenAIConfig] = useState({
    apiKey: '',
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7,
    configured: false,
  })
  
  // Google Sheets Config
  const [googleConfig, setGoogleConfig] = useState({
    serviceEmail: '',
    privateKey: '',
    hasPrivateKey: false,
    configured: false,
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      // Load OpenAI config
      const openaiRes = await apiFetch(`${apiUrl}/api/settings/openai`)
      if (openaiRes.ok) {
        const data = await openaiRes.json()
        setOpenAIConfig({
          apiKey: '', // Never expose the actual key
          model: data.model || 'gpt-3.5-turbo',
          maxTokens: data.maxTokens || 500,
          temperature: data.temperature || 0.7,
          configured: data.configured,
        })
      }
      
      // Load Google Sheets config
      const googleRes = await apiFetch(`${apiUrl}/api/settings/google-sheets`)
      if (googleRes.ok) {
        const data = await googleRes.json()
        setGoogleConfig({
          serviceEmail: data.serviceEmail || '',
          privateKey: '',
          hasPrivateKey: data.hasPrivateKey,
          configured: data.configured,
        })
      }

      // Load Gmail OAuth status
      const gmailRes = await apiFetch(`${apiUrl}/api/email-auth/status`)
      if (gmailRes.ok) {
        const data = await gmailRes.json()
        setGmailStatus({
          connected: !!data?.google?.connected,
          email: data?.google?.email || null,
        })
      } else {
        setGmailStatus({ connected: false })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
    setLoading(false)
  }

  const connectGmail = async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const res = await apiFetch(`${apiUrl}/api/email-auth/google/url`)
      const data = await res.json()
      if (!res.ok || !data?.url) {
        throw new Error(data?.message || 'Falha ao iniciar conexão com Gmail')
      }
      window.location.href = data.url
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Erro ao conectar Gmail' })
      setSaving(false)
    }
  }

  const disconnectGmail = async () => {
    if (!confirm('Desconectar o Gmail deste CRM?')) return
    setSaving(true)
    setTestResult(null)
    try {
      const res = await apiFetch(`${apiUrl}/api/email-auth/google`, { method: 'DELETE' })
      if (res.ok) {
        setGmailStatus({ connected: false })
        setTestResult({ success: true, message: 'Gmail desconectado.' })
      } else {
        const data = await res.json().catch(() => ({}))
        setTestResult({ success: false, message: data?.message || 'Falha ao desconectar' })
      }
    } catch {
      setTestResult({ success: false, message: 'Erro de conexão' })
    }
    setSaving(false)
  }

  const sendGmailTest = async () => {
    if (!gmailTestTo.trim()) {
      setTestResult({ success: false, message: 'Informe um e-mail para enviar o teste.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await apiFetch(`${apiUrl}/api/email-auth/google/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: gmailTestTo.trim(),
          subject: 'Teste de envio - CRM',
          html: `<div style="font-family:Arial,sans-serif;padding:16px"><h2 style="margin:0 0 8px">Teste de envio</h2><p style="margin:0">Se você recebeu este e-mail, a conexão com o Gmail está OK.</p></div>`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        setTestResult({ success: true, message: 'Teste enviado! Verifique sua caixa de entrada.' })
      } else {
        setTestResult({ success: false, message: data?.message || 'Falha ao enviar teste' })
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Erro de conexão' })
    } finally {
      setTesting(false)
    }
  }

  const saveOpenAIConfig = async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const body: any = {
        model: openAIConfig.model,
        maxTokens: openAIConfig.maxTokens,
        temperature: openAIConfig.temperature,
      }
      
      // Only send apiKey if it was changed (not empty)
      if (openAIConfig.apiKey) {
        body.apiKey = openAIConfig.apiKey
      }
      
      const res = await apiFetch(`${apiUrl}/api/settings/openai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (res.ok) {
        setOpenAIConfig(prev => ({ ...prev, apiKey: '', configured: true }))
        setTestResult({ success: true, message: 'Configurações salvas!' })
      } else {
        setTestResult({ success: false, message: 'Erro ao salvar' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro de conexão' })
    }
    setSaving(false)
  }

  const testOpenAI = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await apiFetch(`${apiUrl}/api/settings/openai/test`, {
        method: 'POST',
      })
      const data = await res.json()
      setTestResult({ success: data.success, message: data.message || data.error })
    } catch (error) {
      setTestResult({ success: false, message: 'Erro de conexão' })
    }
    setTesting(false)
  }

  const saveGoogleConfig = async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const body: any = {}
      if (googleConfig.serviceEmail) body.serviceEmail = googleConfig.serviceEmail
      if (googleConfig.privateKey) body.privateKey = googleConfig.privateKey
      
      const res = await apiFetch(`${apiUrl}/api/settings/google-sheets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (res.ok) {
        setGoogleConfig(prev => ({ ...prev, privateKey: '', hasPrivateKey: true, configured: true }))
        setTestResult({ success: true, message: 'Configurações do Google salvas!' })
      } else {
        setTestResult({ success: false, message: 'Erro ao salvar' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro de conexão' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Integrações</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Configure as integrações do sistema (IA, planilhas, etc)</p>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div className={`mb-6 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <p className="flex items-center">
            {testResult.success ? <Check className="h-5 w-5 mr-2" /> : <X className="h-5 w-5 mr-2" />}
            {testResult.message}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* Gmail (OAuth) */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Gmail (envio de e-mails)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Conecte seu Gmail e autorize o CRM a enviar campanhas (sem senha/SMTP).
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${gmailStatus?.connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {gmailStatus?.connected ? 'Conectado' : 'Não conectado'}
            </div>
          </div>

          {gmailStatus?.connected && (
            <div className="mb-4 p-3 bg-white dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Conta conectada: <span className="font-semibold">{gmailStatus.email || '—'}</span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!gmailStatus?.connected ? (
              <button
                type="button"
                onClick={connectGmail}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 disabled:opacity-70"
              >
                Conectar Gmail
              </button>
            ) : (
              <button
                type="button"
                onClick={disconnectGmail}
                disabled={saving}
                className="px-4 py-2 rounded-lg font-medium border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-70"
              >
                Desconectar
              </button>
            )}
            <button
              type="button"
              onClick={loadConfigs}
              className="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Recarregar status
            </button>
          </div>

          {gmailStatus?.connected && (
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Enviar e-mail de teste</p>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  value={gmailTestTo}
                  onChange={(e) => setGmailTestTo(e.target.value)}
                  placeholder="email@destino.com"
                  className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={sendGmailTest}
                  disabled={testing || saving}
                  className="px-4 py-2 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700 disabled:opacity-70"
                >
                  {testing ? 'Enviando...' : 'Enviar teste'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Isso usa o Gmail conectado. Se falhar, normalmente é falta de configuração do Google OAuth/Redirect URI.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Observação: para o botão funcionar em produção, a API precisa estar com o Google OAuth configurado (Client ID/Secret + Redirect URI).
          </p>
        </div>

        {/* OpenAI / ChatGPT */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">OpenAI / ChatGPT</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure a API do ChatGPT para respostas inteligentes
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${openAIConfig.configured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {openAIConfig.configured ? 'Configurado' : 'Não configurado'}
            </div>
          </div>

          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={openAIConfig.apiKey}
                  onChange={(e) => setOpenAIConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={openAIConfig.configured ? '••••••••••••••••••••••••••••••' : 'sk-...'}
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                Obtenha sua chave em 
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-green-600 hover:underline inline-flex items-center">
                  platform.openai.com <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modelo
              </label>
              <select
                value={openAIConfig.model}
                onChange={(e) => setOpenAIConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido e econômico)</option>
                <option value="gpt-4">GPT-4 (Mais inteligente)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Rápido e inteligente)</option>
                <option value="gpt-4o">GPT-4o (Mais recente)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Econômico)</option>
              </select>
            </div>

            {/* Temperature & Max Tokens */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Criatividade (Temperature)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={openAIConfig.temperature}
                  onChange={(e) => setOpenAIConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 = Preciso, 2 = Criativo</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Máx. Tokens
                </label>
                <input
                  type="number"
                  min="50"
                  max="4000"
                  value={openAIConfig.maxTokens}
                  onChange={(e) => setOpenAIConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tamanho máx. da resposta</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={testOpenAI}
                disabled={testing || !openAIConfig.configured}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testing ? 'Testando...' : 'Testar Conexão'}
              </button>
              <button
                onClick={saveOpenAIConfig}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>

        {/* Google Sheets */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                <Table className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Google Sheets</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure para enviar dados para planilhas
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${googleConfig.configured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {googleConfig.configured ? 'Configurado' : 'Não configurado'}
            </div>
          </div>

          <div className="space-y-4">
            {/* Service Account Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail da Conta de Serviço *
              </label>
              <input
                type="email"
                value={googleConfig.serviceEmail}
                onChange={(e) => setGoogleConfig(prev => ({ ...prev, serviceEmail: e.target.value }))}
                placeholder="sua-conta@seu-projeto.iam.gserviceaccount.com"
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
              />
            </div>

            {/* Private Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chave Privada (Private Key) {googleConfig.hasPrivateKey && <span className="text-green-600">(já configurada)</span>}
              </label>
              <textarea
                value={googleConfig.privateKey}
                onChange={(e) => setGoogleConfig(prev => ({ ...prev, privateKey: e.target.value }))}
                placeholder={googleConfig.hasPrivateKey ? 'Deixe em branco para manter a chave atual' : '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                rows={4}
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 font-mono text-sm"
              />
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Como configurar</h4>
              <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="underline">Google Cloud Console</a></li>
                <li>Crie um projeto e ative a API do Google Sheets</li>
                <li>Vá em IAM & Admin &gt; Service Accounts e crie uma conta de serviço</li>
                <li>Crie uma chave JSON e copie os dados para cá</li>
                <li>Compartilhe suas planilhas com o e-mail da conta de serviço</li>
              </ol>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={saveGoogleConfig}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para gerenciar Contas WhatsApp (Multi-números)
function WhatsAppAccountsSettings() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    phoneNumberId: '',
    businessId: '',
    accessToken: '',
    webhookVerifyToken: 'sol_verify_token',
    isDefault: false,
  })
  
  // Para gerenciar acesso de usuários
  const [allUsers, setAllUsers] = useState<{id: string, name: string, email: string, color?: string}[]>([])
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [selectedAccountForUsers, setSelectedAccountForUsers] = useState<any>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [savingUsers, setSavingUsers] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  const fetchAccounts = async () => {
    try {
      const res = await apiFetch(`${apiUrl}/api/whatsapp-accounts`)
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
    setLoading(false)
  }
  
  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`${apiUrl}/api/users`)
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  useEffect(() => {
    fetchAccounts()
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingAccount 
        ? `${apiUrl}/api/whatsapp-accounts/${editingAccount.id}`
        : `${apiUrl}/api/whatsapp-accounts`
      
      const res = await apiFetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingAccount(null)
        setFormData({
          name: '',
          phoneNumber: '',
          phoneNumberId: '',
          businessId: '',
          accessToken: '',
          webhookVerifyToken: 'sol_verify_token',
          isDefault: false,
        })
        fetchAccounts()
      } else {
        const error = await res.json()
        alert(`Erro: ${error.message || 'Falha ao salvar'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      alert('Erro ao salvar conta')
    }
  }

  const handleEdit = (account: any) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      phoneNumber: account.phoneNumber,
      phoneNumberId: account.phoneNumberId,
      businessId: account.businessId,
      accessToken: account.accessToken,
      webhookVerifyToken: account.webhookVerifyToken,
      isDefault: account.isDefault,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return
    
    try {
      const res = await apiFetch(`${apiUrl}/api/whatsapp-accounts/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchAccounts()
      } else {
        const error = await res.json()
        alert(`Erro: ${error.message || 'Falha ao excluir'}`)
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await apiFetch(`${apiUrl}/api/whatsapp-accounts/${id}/set-default`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error('Erro ao definir padrão:', error)
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const res = await apiFetch(`${apiUrl}/api/whatsapp-accounts/${id}/test`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        alert(`✅ Conexão OK!\n\nNome: ${data.data.verifiedName}\nNúmero: ${data.data.displayPhoneNumber}\nQualidade: ${data.data.qualityRating}`)
      } else {
        alert(`❌ Falha na conexão:\n${data.error}`)
      }
    } catch (error) {
      alert('❌ Erro ao testar conexão')
    }
    setTesting(null)
  }
  
  // Abrir modal de gerenciar usuários
  const handleManageUsers = async (account: any) => {
    setSelectedAccountForUsers(account)
    // Buscar detalhes da conta com usuários
    try {
      const res = await apiFetch(`${apiUrl}/api/whatsapp-accounts/${account.id}`)
      if (res.ok) {
        const data = await res.json()
        // Se tem allowedUsers, são os usuários com acesso restrito
        // Se não tem ou está vazio, todos têm acesso
        setSelectedUserIds((data.allowedUsers || []).map((u: any) => u.id))
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      setSelectedUserIds([])
    }
    setShowUsersModal(true)
  }
  
  // Salvar usuários com acesso
  const handleSaveUsers = async () => {
    if (!selectedAccountForUsers) return
    setSavingUsers(true)
    try {
      const res = await apiFetch(`${apiUrl}/api/whatsapp-accounts/${selectedAccountForUsers.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      })
      if (res.ok) {
        setShowUsersModal(false)
        fetchAccounts()
      } else {
        const error = await res.json()
        alert(`Erro: ${error.message || 'Falha ao salvar'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar usuários:', error)
      alert('Erro ao salvar usuários')
    }
    setSavingUsers(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Contas WhatsApp
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie múltiplos números de WhatsApp Business
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAccount(null)
              setFormData({
                name: '',
                phoneNumber: '',
                phoneNumberId: '',
                businessId: '',
                accessToken: '',
                webhookVerifyToken: 'sol_verify_token',
                isDefault: false,
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar Conta
          </button>
        </div>
      </div>

      {/* Lista de contas */}
      <div className="space-y-4">
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Nenhuma conta WhatsApp cadastrada</p>
            <p className="text-sm text-gray-500 mt-2">Clique em "Adicionar Conta" para começar</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className={`border rounded-xl p-4 transition-all ${
                account.isDefault 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    account.isDefault ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                      {account.isDefault && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full">
                          Padrão
                        </span>
                      )}
                      {account.isActive ? (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 text-xs rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{account.phoneNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {account._count?.conversations || 0} conversas • {account._count?.campaigns || 0} campanhas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!account.isDefault && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Tornar Padrão
                    </button>
                  )}
                  <button
                    onClick={() => handleManageUsers(account)}
                    className="px-3 py-1.5 text-sm border border-purple-300 text-purple-600 dark:border-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-1"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Acesso
                  </button>
                  <button
                    onClick={() => handleTest(account.id)}
                    disabled={testing === account.id}
                    className="px-3 py-1.5 text-sm border border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                  >
                    {testing === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Testar'
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">💡 Sobre Multi-Números</h3>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Cada conta representa um número de WhatsApp Business diferente</li>
          <li>• A conta padrão será usada quando nenhuma for especificada</li>
          <li>• As conversas são automaticamente vinculadas à conta que recebeu a mensagem</li>
          <li>• Use "Testar" para verificar se as credenciais estão corretas</li>
        </ul>
      </div>

      {/* Modal de adicionar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAccount ? 'Editar Conta' : 'Nova Conta WhatsApp'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Comercial, Suporte, Vendas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Telefone
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="+55 11 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number ID * <span className="text-gray-400">(Meta)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phoneNumberId}
                  onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Account ID <span className="text-gray-400">(WABA ID)</span>
                </label>
                <input
                  type="text"
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  placeholder="119555137908268"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Token * <span className="text-gray-400">(Permanente)</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  placeholder="EAAxxxxxxxxxx..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={formData.webhookVerifyToken}
                  onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="sol_verify_token"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                  Definir como conta padrão
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingAccount ? 'Salvar' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de gerenciar acesso de usuários */}
      {showUsersModal && selectedAccountForUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Controle de Acesso
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedAccountForUsers.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Selecione os usuários que podem acessar esta conta. Se nenhum for selecionado, <strong>todos</strong> terão acesso.
              </p>
              
              <div className="space-y-2">
                {allUsers.map(user => (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUserIds.includes(user.id)
                        ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
                        : 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds([...selectedUserIds, user.id])
                        } else {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: user.color || '#6B7280' }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              
              {selectedUserIds.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Nenhum usuário selecionado = <strong>todos</strong> têm acesso
                  </p>
                </div>
              )}
              
              {selectedUserIds.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    ✓ Apenas {selectedUserIds.length} usuário(s) terão acesso
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                type="button"
                onClick={() => setShowUsersModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUsers}
                disabled={savingUsers}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingUsers ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Acesso'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para gerenciar Respostas Rápidas
function QuickRepliesSettings() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingReply, setEditingReply] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#6B7280'
  })
  
  const [replyForm, setReplyForm] = useState({
    name: '',
    content: '',
    shortcut: '',
    categoryId: ''
  })
  
  const colors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#6B7280'
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await apiFetch(`${apiUrl}/api/quick-replies/categories`)
      if (response.ok) {
        setCategories(await response.json())
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async () => {
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const method = editingCategory ? 'PUT' : 'POST'
      const url = editingCategory 
        ? `${apiUrl}/api/quick-replies/categories/${editingCategory.id}`
        : `${apiUrl}/api/quick-replies/categories`
      
      await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })
      
      await fetchCategories()
      setShowCategoryModal(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', color: '#6B7280' })
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      await apiFetch(`${apiUrl}/api/quick-replies/categories/${id}`, {
        method: 'DELETE'
      })
      await fetchCategories()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
    }
  }

  const handleSaveReply = async () => {
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const method = editingReply ? 'PUT' : 'POST'
      const url = editingReply 
        ? `${apiUrl}/api/quick-replies/${editingReply.id}`
        : `${apiUrl}/api/quick-replies`
      
      await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replyForm)
      })
      
      await fetchCategories()
      setShowReplyModal(false)
      setEditingReply(null)
      setReplyForm({ name: '', content: '', shortcut: '', categoryId: '' })
    } catch (error) {
      console.error('Erro ao salvar resposta rápida:', error)
      alert('Erro ao salvar resposta rápida')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReply = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta resposta rápida?')) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      await apiFetch(`${apiUrl}/api/quick-replies/${id}`, {
        method: 'DELETE'
      })
      await fetchCategories()
    } catch (error) {
      console.error('Erro ao excluir resposta rápida:', error)
    }
  }

  const openEditCategory = (category: any) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6B7280'
    })
    setShowCategoryModal(true)
  }

  const openEditReply = (reply: any) => {
    setEditingReply(reply)
    setReplyForm({
      name: reply.name,
      content: reply.content,
      shortcut: reply.shortcut || '',
      categoryId: reply.categoryId || ''
    })
    setShowReplyModal(true)
  }

  const openNewReply = (categoryId?: string) => {
    setEditingReply(null)
    setReplyForm({
      name: '',
      content: '',
      shortcut: '',
      categoryId: categoryId || ''
    })
    setShowReplyModal(true)
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Respostas Rápidas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Crie mensagens pré-definidas para seus atendentes usarem nas conversas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingCategory(null)
              setCategoryForm({ name: '', description: '', color: '#6B7280' })
              setShowCategoryModal(true)
            }}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Nova Categoria
          </button>
          <button
            onClick={() => openNewReply()}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Resposta
          </button>
        </div>
      </div>

      {/* Lista de categorias e respostas */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Zap className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Nenhuma categoria cadastrada</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Crie categorias para organizar suas respostas rápidas
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Header da categoria */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700"
                style={{ borderLeft: `4px solid ${category.color || '#6B7280'}` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    {category.quickReplies?.length || 0} respostas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openNewReply(category.id)}
                    className="p-1 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded"
                    title="Adicionar resposta"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditCategory(category)}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Editar categoria"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Excluir categoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Lista de respostas */}
              {category.quickReplies && category.quickReplies.length > 0 && (
                <div className="divide-y dark:divide-gray-700">
                  {category.quickReplies.map((reply: any) => (
                    <div key={reply.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{reply.name}</span>
                          {reply.shortcut && (
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                              {reply.shortcut}
                            </code>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{reply.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openEditReply(reply)}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Saudações"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Mensagens de boas-vindas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        categoryForm.color === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={saving || !categoryForm.name}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resposta Rápida */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingReply ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
              </h3>
              <button onClick={() => setShowReplyModal(false)}>
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={replyForm.name}
                  onChange={(e) => setReplyForm({ ...replyForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Bom dia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atalho (opcional)</label>
                <input
                  type="text"
                  value={replyForm.shortcut}
                  onChange={(e) => setReplyForm({ ...replyForm, shortcut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: /bomdia"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Digite o atalho no chat para inserir rapidamente</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select
                  value={replyForm.categoryId}
                  onChange={(e) => setReplyForm({ ...replyForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo da mensagem</label>
                <textarea
                  value={replyForm.content}
                  onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Digite a mensagem que será enviada..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Dica: Use {"{{nome}}"} para variáveis dinâmicas
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReply}
                disabled={saving || !replyForm.name || !replyForm.content}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  useRequirePermission('settings')
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [saving, setSaving] = useState(false)

  // Estados para configurações
  const [whatsappConfig, setWhatsappConfig] = useState({
    accessToken: process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '',
    webhookUrl: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/wa/webhook` : 'https://crm-api-laxv.onrender.com/api/wa/webhook',
    verifyToken: 'sol_instituto_verify_2025',
    businessId: process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_ID || '119555137908268'
  })

  const [businessConfig, setBusinessConfig] = useState({
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    website: '',
    address: '',
    companyLogo: ''
  })

  const [notificationConfig, setNotificationConfig] = useState({
    emailNotifications: true,
    webhookNotifications: false,
    soundNotifications: true
  })

  // Estados para gerenciar listas personalizadas
  const [customFieldOptions, setCustomFieldOptions] = useState<any[]>([])
  const [editingOption, setEditingOption] = useState<any>(null)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [optionForm, setOptionForm] = useState({
    fieldType: 'customerStatus',
    value: '',
    label: '',
    color: '#6B7280'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    // Carregar configurações salvas
    const savedWhatsapp = localStorage.getItem('whatsapp_config')
    const savedNotifications = localStorage.getItem('notification_config')
    
    if (savedWhatsapp) {
      try {
        setWhatsappConfig(JSON.parse(savedWhatsapp))
      } catch (e) {
        console.log('Erro ao carregar config WhatsApp')
      }
    }
    
    if (savedNotifications) {
      try {
        setNotificationConfig(JSON.parse(savedNotifications))
      } catch (e) {
        console.log('Erro ao carregar config Notifications')
      }
    }

    // Carregar configurações da empresa do banco (API)
    const loadBusinessFromAPI = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const res = await apiFetch(`${apiUrl}/api/settings/system`)
        if (res.ok) {
          const data = await res.json()
          setBusinessConfig({
            companyName: data.companyName || '',
            companyPhone: data.companyPhone || '',
            companyEmail: data.companyEmail || '',
            website: '',
            address: data.companyAddress || '',
            companyLogo: data.companyLogo || ''
          })
        }
      } catch (e) {
        // API falhou - sem fallback em localStorage
      }
    }
    
    loadBusinessFromAPI()

    // Carregar listas personalizadas
    if (activeTab === 'custom-fields') {
      fetchCustomFieldOptions()
    }
  }, [status, activeTab])

  const fetchCustomFieldOptions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/settings/field-options`)
      if (res.ok) {
        const data = await res.json()
        // Garantir que seja um array
        setCustomFieldOptions(Array.isArray(data) ? data : [])
      } else {
        setCustomFieldOptions([])
      }
    } catch (error) {
      console.error('Erro ao carregar opções personalizadas:', error)
      setCustomFieldOptions([])
    }
  }

  const handleOpenOptionModal = (option?: any) => {
    if (option) {
      setEditingOption(option)
      setOptionForm({
        fieldType: option.fieldType,
        value: option.value,
        label: option.label,
        color: option.color || '#6B7280'
      })
    } else {
      setEditingOption(null)
      setOptionForm({
        fieldType: 'customerStatus',
        value: '',
        label: '',
        color: '#6B7280'
      })
    }
    setShowOptionModal(true)
  }

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const url = editingOption
        ? `${apiUrl}/api/settings/field-options/${editingOption.id}`
        : `${apiUrl}/api/settings/field-options`

      const res = await apiFetch(url, {
        method: editingOption ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optionForm)
      })

      if (res.ok) {
        setShowOptionModal(false)
        fetchCustomFieldOptions()
      }
    } catch (error) {
      console.error('Erro ao salvar opção:', error)
    }
  }

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta opção?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/settings/field-options/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchCustomFieldOptions()
      }
    } catch (error) {
      console.error('Erro ao deletar opção:', error)
    }
  }


  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar configurações locais no localStorage
      localStorage.setItem('whatsapp_config', JSON.stringify(whatsappConfig))
      localStorage.setItem('notification_config', JSON.stringify(notificationConfig))
      
      // Salvar configurações da empresa no banco (API)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await apiFetch(`${apiUrl}/api/settings/system`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: businessConfig.companyName,
          companyLogo: businessConfig.companyLogo,
          companyPhone: businessConfig.companyPhone,
          companyEmail: businessConfig.companyEmail,
          companyAddress: businessConfig.address,
        })
      })
      
      if (res.ok) {
        // Disparar evento para atualizar sidebar imediatamente
        window.dispatchEvent(new Event('business-config-updated'))
        alert('✅ Configurações salvas com sucesso!')
      } else {
        throw new Error('Falha ao salvar no servidor')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      // Fallback: salvar localmente também
      localStorage.setItem('business_config', JSON.stringify(businessConfig))
      alert('⚠️ Configurações salvas localmente (servidor indisponível)')
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'whatsapp', name: 'WhatsApp API', icon: MessageSquare },
    { id: 'business', name: 'Empresa', icon: Users },
    { id: 'permissions', name: 'Permissões', icon: UserCog },
    { id: 'integrations', name: 'Integrações (IA)', icon: Plug },
    { id: 'custom-fields', name: 'Listas Personalizadas', icon: List },
    { id: 'quick-replies', name: 'Respostas Rápidas', icon: Zap },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'appearance', name: 'Aparência', icon: Palette }
  ]

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header com gradiente */}
        <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Configurações</h1>
              <p className="text-green-100 mt-1">Gerencie as configurações do seu CRM</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de tabs - Design melhorado */}
          <div className="lg:w-72">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Menu</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-1 ${
                      activeTab === tab.id
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-800'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <tab.icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-green-600 dark:text-green-400' : ''}`} />
                    {tab.name}
                    {activeTab === tab.id && (
                      <Check className="ml-auto h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Conteúdo das configurações - Design melhorado */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {/* WhatsApp Accounts Tab */}
              {activeTab === 'whatsapp' && <WhatsAppAccountsSettings />}

              {/* Permissões Tab - matriz de perfis */}
              {activeTab === 'permissions' && (
                <div className="p-6">
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Permissões por Perfil
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cada usuário recebe um perfil ao ser criado. Altere o perfil em Usuários → Editar.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Módulo</th>
                          <th className="text-center py-3 px-4 font-medium text-indigo-600">Admin</th>
                          <th className="text-center py-3 px-4 font-medium text-blue-600">Supervisor</th>
                          <th className="text-center py-3 px-4 font-medium text-green-600">Atendente</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Visualizador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {[
                          { mod: 'Dashboard', a: 'Total', s: 'Total', g: 'Básico', v: 'Leitura' },
                          { mod: 'Inbox', a: 'Total', s: 'Total', g: 'Atribuídas', v: 'Leitura' },
                          { mod: 'Contatos', a: 'CRUD', s: 'CRUD', g: 'CRUD', v: 'Leitura' },
                          { mod: 'Pipeline', a: 'Total', s: 'Total', g: 'Editar', v: 'Leitura' },
                          { mod: 'Templates', a: 'CRUD', s: 'Ver', g: 'Usar', v: 'Leitura' },
                          { mod: 'Automação', a: 'CRUD', s: 'Editar', g: '—', v: '—' },
                          { mod: 'Base de Conhecimento', a: 'CRUD', s: 'CRUD', g: 'Usar IA', v: 'Leitura' },
                          { mod: 'Campanhas', a: 'CRUD', s: 'Criar/Enviar', g: '—', v: '—' },
                          { mod: 'Relatórios', a: 'Total', s: 'Total', g: 'Básico', v: 'Básico' },
                          { mod: 'Usuários', a: 'CRUD', s: 'Ver/Editar', g: '—', v: '—' },
                          { mod: 'Configurações', a: 'Total', s: '—', g: '—', v: '—' },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.mod}</td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.a}</td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.s}</td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.g}</td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Para alterar o perfil de um usuário, vá em Usuários e edite o cadastro.
                  </p>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === 'business' && (
                <div className="p-6">
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Informações da Empresa
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Configure os dados da sua empresa</p>
                  </div>

                  <div className="space-y-6">
                    {/* Logo da Empresa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo da Empresa</label>
                      <div className="flex items-start space-x-4">
                        {businessConfig.companyLogo ? (
                          <img 
                            src={businessConfig.companyLogo} 
                            alt="Logo" 
                            className="h-20 w-20 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white"
                          />
                        ) : (
                          <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 space-y-3">
                          {/* Upload de arquivo */}
                          <div>
                            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert('Arquivo muito grande. Máximo 2MB.')
                                    return
                                  }
                                  try {
                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                                    const formData = new FormData()
                                    formData.append('file', file)
                                    const res = await apiFetch(`${apiUrl}/api/settings/upload-logo`, {
                                      method: 'POST',
                                      body: formData
                                    })
                                    if (res.ok) {
                                      const data = await res.json()
                                      setBusinessConfig({...businessConfig, companyLogo: data.url})
                                    } else {
                                      alert('Erro ao fazer upload')
                                    }
                                  } catch (err) {
                                    console.error(err)
                                    alert('Erro ao fazer upload')
                                  }
                                }}
                              />
                              <Upload className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Fazer upload de imagem</span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">PNG, JPG, SVG ou WebP (máx. 2MB)</p>
                          </div>
                          {/* OU URL */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
                            <span className="text-xs text-gray-400">ou cole uma URL</span>
                            <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
                          </div>
                          <input
                            type="url"
                            value={businessConfig.companyLogo?.startsWith('data:') ? '' : businessConfig.companyLogo}
                            onChange={(e) => setBusinessConfig({...businessConfig, companyLogo: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder="https://exemplo.com/logo.png"
                          />
                        </div>
                        {businessConfig.companyLogo && (
                          <button
                            onClick={() => setBusinessConfig({...businessConfig, companyLogo: ''})}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover logo"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Empresa</label>
                      <input
                        type="text"
                        value={businessConfig.companyName}
                        onChange={(e) => setBusinessConfig({...businessConfig, companyName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Minha Empresa Ltda"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este nome aparecerá no menu lateral do sistema</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={businessConfig.companyPhone}
                        onChange={(e) => setBusinessConfig({...businessConfig, companyPhone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="+55 11 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={businessConfig.companyEmail}
                        onChange={(e) => setBusinessConfig({...businessConfig, companyEmail: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="contato@minhaempresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                      <input
                        type="url"
                        value={businessConfig.website}
                        onChange={(e) => setBusinessConfig({...businessConfig, website: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://www.minhaempresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endereço</label>
                      <textarea
                        rows={3}
                        value={businessConfig.address}
                        onChange={(e) => setBusinessConfig({...businessConfig, address: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Rua das Flores, 123 - Centro - São Paulo - SP"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && <IntegrationsSettings />}

              {/* Custom Fields Tab */}
              {activeTab === 'custom-fields' && (
                <div className="p-6">
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <List className="h-5 w-5 text-green-600" />
                        Listas Personalizadas
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie as opções de Status e Origem dos contatos</p>
                    </div>
                    <button
                      onClick={() => handleOpenOptionModal()}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Nova Opção
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Status Cliente */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📊 Status do Cliente</h3>
                      <div className="space-y-2">
                        {(customFieldOptions || [])
                          .filter(opt => opt.fieldType === 'customerStatus')
                          .sort((a, b) => a.order - b.order)
                          .map(option => (
                            <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: option.color || '#6B7280' }}></div>
                                <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">({option.value})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenOptionModal(option)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                >
                                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOption(option.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {(customFieldOptions || []).filter(opt => opt.fieldType === 'customerStatus').length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma opção cadastrada</p>
                        )}
                      </div>
                    </div>

                    {/* Origem do Lead */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📱 Origem do Lead</h3>
                      <div className="space-y-2">
                        {(customFieldOptions || [])
                          .filter(opt => opt.fieldType === 'source')
                          .sort((a, b) => a.order - b.order)
                          .map(option => (
                            <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: option.color || '#6B7280' }}></div>
                                <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">({option.value})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenOptionModal(option)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                >
                                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOption(option.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {(customFieldOptions || []).filter(opt => opt.fieldType === 'source').length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma opção cadastrada</p>
                        )}
                      </div>
                    </div>

                    {/* Campos de Coleta (Fluxos) */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📝 Campos de Coleta (Automação)</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Campos que podem ser coletados nos fluxos de automação e salvos no contato</p>
                      <div className="space-y-2">
                        {(customFieldOptions || [])
                          .filter(opt => opt.fieldType === 'contactField')
                          .sort((a, b) => a.order - b.order)
                          .map(option => (
                            <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-teal-500"></div>
                                <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                                <code className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{option.value}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenOptionModal(option)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                >
                                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOption(option.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {(customFieldOptions || []).filter(opt => opt.fieldType === 'contactField').length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Nenhum campo cadastrado. Adicione campos como "interesse", "horario_preferido", etc.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Replies Tab */}
              {activeTab === 'quick-replies' && (
                <QuickRepliesSettings />
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-green-600" />
                      Configurações de Notificação
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Personalize como você recebe notificações</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notificações por Email</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receba um email quando houver novas mensagens</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationConfig({...notificationConfig, emailNotifications: !notificationConfig.emailNotifications})}
                        className={`${
                          notificationConfig.emailNotifications ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationConfig.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Webhooks</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enviar notificações para sistemas externos</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationConfig({...notificationConfig, webhookNotifications: !notificationConfig.webhookNotifications})}
                        className={`${
                          notificationConfig.webhookNotifications ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationConfig.webhookNotifications ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sons de Notificação</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reproduzir som quando chegar nova mensagem</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationConfig({...notificationConfig, soundNotifications: !notificationConfig.soundNotifications})}
                        className={`${
                          notificationConfig.soundNotifications ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationConfig.soundNotifications ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Configurações de Segurança
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie a segurança da sua conta</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-500" />
                        Alterar Senha
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha Atual</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova Senha</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Nova Senha</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                          Alterar Senha
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Sessões Ativas</h3>
                      <div className="bg-white dark:bg-gray-800 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Sessão Atual</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Windows • Chrome • São Paulo, SP</p>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Ativo agora</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <AppearanceSettings />
              )}

              {/* Save Button */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Criar/Editar Opção */}
        {showOptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingOption ? 'Editar Opção' : 'Nova Opção'}
                </h3>
                <button
                  onClick={() => setShowOptionModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveOption} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Campo *
                  </label>
                  <select
                    value={optionForm.fieldType}
                    onChange={(e) => setOptionForm({ ...optionForm, fieldType: e.target.value })}
                    className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                    disabled={!!editingOption}
                  >
                    <option value="customerStatus">Status do Cliente</option>
                    <option value="source">Origem do Lead</option>
                    <option value="contactField">Campo de Coleta (Automação)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {optionForm.fieldType === 'contactField' ? 'Nome do Campo (saveAs) *' : 'Valor (ID) *'}
                  </label>
                  <input
                    type="text"
                    value={optionForm.value}
                    onChange={(e) => setOptionForm({ ...optionForm, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                    placeholder={optionForm.fieldType === 'contactField' ? 'Ex: interesse, horario_preferido' : 'Ex: lead, cliente, instagram'}
                    required
                    disabled={!!editingOption}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {optionForm.fieldType === 'contactField' 
                      ? 'Use este nome no "Salvar como" do nó Coletar Dados' 
                      : 'Identificador único (sem espaços)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label (Nome de Exibição) *
                  </label>
                  <input
                    type="text"
                    value={optionForm.label}
                    onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })}
                    className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                    placeholder={optionForm.fieldType === 'contactField' ? 'Ex: Curso de Interesse, Horário Preferido' : 'Ex: Lead, Cliente, Instagram'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={optionForm.color}
                      onChange={(e) => setOptionForm({ ...optionForm, color: e.target.value })}
                      className="w-12 h-10 rounded border dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={optionForm.color}
                      onChange={(e) => setOptionForm({ ...optionForm, color: e.target.value })}
                      className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowOptionModal(false)}
                    className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingOption ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}