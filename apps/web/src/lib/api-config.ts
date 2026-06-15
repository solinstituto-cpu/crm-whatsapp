/**
 * Configuração centralizada da URL da API.
 * 
 * Problema: A env var NEXT_PUBLIC_API_URL no Vercel aponta para um backend antigo
 * (crm-whatsapp-1-om9h.onrender.com) que não tem o filtro de contatos por conta.
 * O backend correto é crm-api-laxv.onrender.com.
 * 
 * Esta função detecta e corrige automaticamente o URL errado em RUNTIME.
 */

const CORRECT_API_URL = 'https://crm-api-laxv.onrender.com'
const WRONG_API_PATTERNS = ['crm-whatsapp-1', 'crm-drm.onrender']

export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  // Se a URL contém um dos padrões errados, substituir pela correta
  if (envUrl && WRONG_API_PATTERNS.some(pattern => envUrl.includes(pattern))) {
    return CORRECT_API_URL
  }
  
  // Se estamos em produção (Vercel) sem URL definida, usar a URL correta
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && !envUrl) {
    return CORRECT_API_URL
  }
  
  // Fallback para desenvolvimento local
  return envUrl || 'http://localhost:4000'
}
