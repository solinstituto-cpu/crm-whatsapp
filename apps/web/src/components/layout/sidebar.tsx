'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  FileText, 
  Zap, 
  LogOut,
  Home,
  TrendingUp,
  Menu,
  X,
  TestTube,
  Megaphone,
  UserCog,
  HelpCircle,
  BookOpen
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Contatos', href: '/contacts', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: TrendingUp },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Automação', href: '/automation', icon: Zap },
  { name: 'Base de Conhecimento', href: '/knowledge', icon: BookOpen },
  { name: 'Campanhas', href: '/campaigns', icon: Megaphone },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Usuários', href: '/users', icon: UserCog },
  { name: 'Configurações', href: '/settings', icon: Settings },
  { name: 'Ajuda', href: '/help', icon: HelpCircle },
]

export default function Sidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [companyName, setCompanyName] = useState('DRM CRM')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  // Carregar configurações da empresa do banco de dados (API)
  useEffect(() => {
    const loadBusinessConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const response = await fetch(`${apiUrl}/api/settings/system`)
        if (response.ok) {
          const config = await response.json()
          if (config.companyName) {
            setCompanyName(config.companyName)
          }
          if (config.companyLogo) {
            setCompanyLogo(config.companyLogo)
          }
        }
      } catch (e) {
        // API falhou - usa defaults (DRM CRM). Sem fallback em localStorage.
      }
    }
    
    loadBusinessConfig()
    
    // Recarregar a cada 30 segundos para pegar mudanças feitas por outros usuários
    const interval = setInterval(loadBusinessConfig, 30000)
    
    // Escutar evento customizado para mudanças imediatas
    const handleConfigUpdate = () => loadBusinessConfig()
    window.addEventListener('business-config-updated', handleConfigUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('business-config-updated', handleConfigUpdate)
    }
  }, [])

  // Função para enviar heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      await fetch(`${apiUrl}/api/users/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
        }),
      })
    } catch (error) {
      console.error('Erro ao enviar heartbeat:', error)
    }
  }, [session?.user?.id])

  // Enviar heartbeat ao iniciar e a cada 2 minutos
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      sendHeartbeat()
      const interval = setInterval(sendHeartbeat, 120000) // 2 minutos
      return () => clearInterval(interval)
    }
  }, [status, session?.user?.id, sendHeartbeat])

  // Handler para sign out que registra logout no servidor
  const handleSignOut = async () => {
    if (session?.user?.id) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        await fetch(`${apiUrl}/api/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
          }),
        })
      } catch (error) {
        console.error('Erro ao registrar logout:', error)
      }
    }
    signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-gray-950 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo - usa cor dinâmica e nome/logo da empresa */}
          <div 
            className="flex items-center justify-center h-16 border-b border-slate-700"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <div className="flex items-center space-x-2">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName}
                  className="h-8 w-8 object-contain rounded"
                />
              ) : (
                <MessageSquare className="h-8 w-8 text-white" />
              )}
              <span className="text-xl font-bold text-white truncate max-w-[160px]">{companyName}</span>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span className="text-sm font-medium text-white">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-slate-400">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  style={isActive ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign out button */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}