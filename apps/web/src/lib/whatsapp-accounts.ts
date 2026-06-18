import { apiFetch } from './api'
import { getApiUrl } from './api-config'

export interface WhatsAppAccountOption {
  id: string
  name: string
  phoneNumber: string
  isDefault: boolean
}

export async function fetchUserWhatsAppAccounts(
  userId?: string
): Promise<WhatsAppAccountOption[]> {
  const apiUrl = getApiUrl()
  const url = userId
    ? `${apiUrl}/api/whatsapp-accounts?userId=${userId}`
    : `${apiUrl}/api/whatsapp-accounts`

  const res = await apiFetch(url)
  if (!res.ok) {
    console.error('Erro ao buscar contas WhatsApp:', res.status, res.statusText)
    return []
  }

  const data = await res.json()
  return data.map((a: any) => ({
    id: a.id,
    name: a.name,
    phoneNumber: a.phoneNumber || '',
    isDefault: a.isDefault,
  }))
}

export function resolveDefaultAccountId(
  accounts: WhatsAppAccountOption[],
  savedAccountId?: string | null
): string {
  if (accounts.length === 0) return ''
  const saved = savedAccountId ? accounts.find((a) => a.id === savedAccountId) : null
  if (saved) return saved.id
  const defaultAcc = accounts.find((a) => a.isDefault)
  return defaultAcc?.id || accounts[0].id
}
