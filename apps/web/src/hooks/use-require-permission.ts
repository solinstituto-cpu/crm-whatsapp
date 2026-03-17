'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccess } from '@/lib/permissions'

/**
 * Redireciona para /dashboard se o usuário não tiver permissão para o módulo.
 * Usar no topo de páginas restritas.
 */
export function useRequirePermission(module: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
      return
    }
    if (status === 'authenticated' && !canAccess(session?.user?.role as string, module)) {
      router.replace('/dashboard')
    }
  }, [status, session?.user?.role, module, router])
}
