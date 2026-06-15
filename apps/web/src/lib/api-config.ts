/**
 * Configuração centralizada da URL da API.
 * 
 * Em produção (Vercel): retorna string vazia → frontend usa caminhos relativos
 * (/api/*) que passam pelo proxy do Vercel → proxy redireciona para crm-api-laxv.
 * Isso é necessário porque a autenticação só funciona pelo proxy (same-origin).
 * 
 * Em desenvolvimento local: usa NEXT_PUBLIC_API_URL ou http://localhost:4000
 */

export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  // Em produção (Vercel), usar caminhos relativos (proxy)
  // A autenticação não funciona com chamadas cross-origin diretas
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return ''
  }
  
  // Desenvolvimento local
  return envUrl || 'http://localhost:4000'
}
