'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Settings,
  Send,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  TestTube,
  Zap,
  Key,
  Eye,
  EyeOff,
  Save
} from 'lucide-react'

// Valores padrão
const DEFAULT_PHONE_NUMBER_ID = '134483439737705'
const DEFAULT_API_VERSION = 'v22.0'

export default function WhatsAppTestPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [phoneNumber, setPhoneNumber] = useState('5511997335755')
  
  // Configurações manuais
  const [showConfig, setShowConfig] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState(DEFAULT_PHONE_NUMBER_ID)
  const [showToken, setShowToken] = useState(false)

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('wa_access_token')
      const savedPhoneId = localStorage.getItem('wa_phone_number_id')
      const envToken = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN
      const envPhoneId = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID
      
      if (savedToken) setAccessToken(savedToken)
      else if (envToken) setAccessToken(envToken)
      
      if (savedPhoneId) setPhoneNumberId(savedPhoneId)
      else if (envPhoneId) setPhoneNumberId(envPhoneId)
    }
  }, [])

  // Salvar configurações no localStorage
  const saveConfig = () => {
    localStorage.setItem('wa_access_token', accessToken)
    localStorage.setItem('wa_phone_number_id', phoneNumberId)
    addTestResult('Config Saved', true, 'Configurações salvas no navegador!')
    setShowConfig(false)
  }

  if (status === 'unauthenticated') {
    redirect('/auth/login')
  }

  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testWhatsAppConfig = async () => {
    setLoading(true)
    setTestResults([])

    try {
      // Teste 1: Verificar configuração
      addTestResult('Config Check', true, 'Verificando configurações...')
      
      if (!accessToken || !phoneNumberId) {
        addTestResult('Config Check', false, 'Token ou Phone Number ID não configurados. Clique em "⚙️ Configurar".')
        setShowConfig(true)
        setLoading(false)
        return
      }

      addTestResult('Config Check', true, `✅ Configuração OK! Phone ID: ${phoneNumberId}`)

      // Teste 2: Verificar informações da conta
      addTestResult('Account Info', true, 'Verificando conta no Meta...')
      
      const accountResponse = await fetch(`https://graph.facebook.com/${DEFAULT_API_VERSION}/${phoneNumberId}?fields=id,display_phone_number,verified_name`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })

      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        addTestResult('Account Info', true, `✅ Conta: ${accountData.display_phone_number || accountData.verified_name || 'Verificada'}`, accountData)
      } else {
        const errorData = await accountResponse.json()
        addTestResult('Account Info', false, `❌ ${errorData.error?.message || 'Token inválido ou expirado'}`, errorData)
        setLoading(false)
        return
      }

      // Teste 3: Enviar mensagem (se número fornecido)
      if (phoneNumber) {
        addTestResult('Send Message', true, `📤 Enviando para ${phoneNumber}...`)
        
        const messageResponse = await fetch(`https://graph.facebook.com/${DEFAULT_API_VERSION}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: {
              body: '🌞 Teste do CRM Sol Instituto! Sistema funcionando perfeitamente. ✅'
            }
          })
        })

        if (messageResponse.ok) {
          const messageData = await messageResponse.json()
          addTestResult('Send Message', true, '✅ Mensagem enviada! Verifique seu WhatsApp.', messageData)
        } else {
          const errorData = await messageResponse.json()
          const errorMsg = errorData.error?.message || 'Falha no envio'
          let hint = ''
          if (errorMsg.includes('not in the allowed list')) {
            hint = ' 💡 Adicione o número na lista de teste do Meta.'
          } else if (errorMsg.includes('Invalid OAuth')) {
            hint = ' 💡 Token expirou. Pegue um novo no Meta.'
          }
          addTestResult('Send Message', false, `❌ ${errorMsg}${hint}`, errorData)
        }
      } else {
        addTestResult('Send Message', false, '⚠️ Digite um número para testar')
      }

    } catch (error) {
      addTestResult('General Error', false, `Erro geral: ${error}`)
    }

    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (status === 'loading') {
    return <div>Carregando...</div>
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <TestTube className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Cloud API - Teste</h1>
              <p className="text-green-100">Teste a integração com a API do WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Configuração de Credenciais */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Credenciais</h2>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 text-sm flex items-center space-x-1"
            >
              <Settings className="h-4 w-4" />
              <span>{showConfig ? 'Ocultar' : '⚙️ Configurar'}</span>
            </button>
          </div>
          
          {/* Status das credenciais */}
          <div className={`p-3 rounded-md ${accessToken ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${accessToken ? 'text-green-700' : 'text-red-700'}`}>
              {accessToken 
                ? `✅ Token configurado (${accessToken.substring(0, 25)}...)` 
                : '❌ Token não configurado - clique em "⚙️ Configurar"'}
            </p>
          </div>

          {showConfig && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token (do Meta Developer)
                </label>
                <div className="flex space-x-2">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAALhsiZB9HoQ..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    title={showToken ? 'Ocultar' : 'Mostrar'}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="134483439737705"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
              </div>

              <button
                onClick={saveConfig}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>
          )}
        </div>

        {/* Configuração de Teste */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <Phone className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Teste de Envio</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número para Teste (com código do país, sem +)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="5511999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use um número da lista de teste do Meta (formato: 5511999999999)
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={testWhatsAppConfig}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors text-lg"
              >
                <Zap className="h-5 w-5" />
                <span>{loading ? 'Testando...' : '🚀 Iniciar Testes'}</span>
              </button>
              
              <button
                onClick={clearResults}
                className="bg-gray-500 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {testResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Resultados dos Testes</h2>
            </div>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md border-l-4 ${
                    result.success 
                      ? 'bg-green-50 border-green-400' 
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.test}</span>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                  
                  <p className={`text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600">
                        Ver detalhes técnicos
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">💡 Dicas Importantes</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>1. <strong>Token expira rápido</strong> - Pegue um novo em <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a> → Seu App → WhatsApp → API Setup</p>
            <p>2. <strong>Número deve estar na lista</strong> - No Meta, adicione o número de destino em &quot;To&quot; antes de testar</p>
            <p>3. <strong>As configurações são salvas</strong> no navegador para facilitar os testes</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}