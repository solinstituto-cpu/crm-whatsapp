'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Users,
  TrendingUp,
  Settings,
  FileText,
  Zap,
  BarChart3,
  Home,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { name: 'Contatos', href: '/dashboard/contacts', icon: Users },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: TrendingUp },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Regras', href: '/dashboard/rules', icon: Zap },
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CRM WhatsApp</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

