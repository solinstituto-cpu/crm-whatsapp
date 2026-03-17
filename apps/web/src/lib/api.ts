/**
 * Fetch com token JWT automático para chamadas à API.
 * Usar em rotas que exigem autenticação (settings, users, whatsapp-accounts).
 */
import { getSession } from 'next-auth/react'

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession()
  const token = (session as any)?.user?.token || (session as any)?.accessToken
  const headers: HeadersInit = {
    ...((options.headers as Record<string, string>) || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  return fetch(url, { ...options, headers })
}
