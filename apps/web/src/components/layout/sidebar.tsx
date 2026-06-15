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
  Mail,
  UserCog,
  HelpCircle,
  BookOpen
} from 'lucide-react'
import { canAccess } from '@/lib/permissions'

// Cache do logo para evitar flash do ícone ao navegar entre telas (Sidebar remonta)
let cachedCompanyLogo: string | null = null
let cachedCompanyName: string = 'Sol Instituto'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, permission: 'dashboard' },
  { name: 'Conversas', href: '/inbox', icon: MessageSquare, permission: 'inbox' },
  { name: 'Contatos', href: '/contacts', icon: Users, permission: 'contacts' },
  { name: 'Pipeline', href: '/pipeline', icon: TrendingUp, permission: 'pipeline' },
  { name: 'Templates', href: '/templates', icon: FileText, permission: 'templates' },
  { name: 'Automação', href: '/automation', icon: Zap, permission: 'automation' },
  { name: 'Base de Conhecimento', href: '/knowledge', icon: BookOpen, permission: 'knowledge' },
  { name: 'Campanhas', href: '/campaigns', icon: Megaphone, permission: 'campaigns' },
  { name: 'E-mail Marketing', href: '/email-marketing', icon: Mail, permission: 'campaigns' },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, permission: 'reports' },
  { name: 'Usuários', href: '/users', icon: UserCog, permission: 'users' },
  { name: 'Configurações', href: '/settings', icon: Settings, permission: 'settings' },
  { name: 'Ajuda', href: '/help', icon: HelpCircle, permission: 'help' },
]

export default function Sidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [companyName, setCompanyName] = useState(cachedCompanyName)
  const [companyLogo, setCompanyLogo] = useState<string | null>(cachedCompanyLogo)

  // Carregar configurações da empresa do banco de dados (API)
  useEffect(() => {
    const loadBusinessConfig = async () => {
      try {
        const apiUrl = getApiUrl()
        const token = (session as any)?.user?.token || (session as any)?.accessToken
        const response = await fetch(`${apiUrl}/api/settings/system`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response.ok) {
          const config = await response.json()
          if (config.companyName) {
            setCompanyName(config.companyName)
            cachedCompanyName = config.companyName
          }
          if (config.companyLogo) {
            setCompanyLogo(config.companyLogo)
            cachedCompanyLogo = config.companyLogo
          } else {
            cachedCompanyLogo = null
          }
        }
      } catch (e) {
        // API falhou - mantém cache se existir. Sem fallback em localStorage.
      }
    }
    
    loadBusinessConfig()
    
    // Recarregar a cada 60 segundos (logo/nome mudam pouco, reduz requisições)
    const interval = setInterval(loadBusinessConfig, 60000)
    
    // Escutar evento customizado para mudanças imediatas
    const handleConfigUpdate = () => loadBusinessConfig()
    window.addEventListener('business-config-updated', handleConfigUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('business-config-updated', handleConfigUpdate)
    }
  }, [session])

  // Função para enviar heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const apiUrl = getApiUrl()
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
        const apiUrl = getApiUrl()
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
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#2A3A32] text-white transform transition-transform duration-300 ease-in-out border-r border-[#E8B868]/20
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo - usa cor dinâmica e nome/logo da empresa */}
          <div 
            className="flex items-center justify-center h-16 border-b border-[#394D43] bg-[#1A251F]"
          >
            <div className="flex items-center space-x-2">
              <img 
                src="/images/logo.png?v=3" 
                alt={companyName}
                className="h-10 w-10 object-contain flex-shrink-0"
              />
              <span className="text-xl font-bold text-[#E8B868] truncate max-w-[160px]">{companyName}</span>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-[#394D43]">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E8B868]"
              >
                <span className="text-sm font-bold text-[#2A3A32]">
                  {session?.user?.name?.replace(/[^a-zA-ZÀ-ÿ]/g, '').charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                <p className="text-xs text-[#E8B868]/70">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation - filtrado por permissão do perfil */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation
              .filter((item) => canAccess(session?.user?.role as string, item.permission))
              .map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'text-[#2A3A32] bg-[#E8B868] font-bold shadow-sm' 
                      : 'text-slate-200 hover:bg-[#394D43] hover:text-[#E8B868]'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign out button */}
          <div className="p-4 border-t border-[#394D43]">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-200 rounded-md hover:bg-[#394D43] hover:text-[#E8B868] transition-colors"
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