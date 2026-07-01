/**
 * Configuração centralizada da URL da API.
 *
 * Em produção (Vercel): NEXT_PUBLIC_API_URL é '' no build → frontend usa
 * caminhos relativos (/api/*) que passam pelo proxy do Vercel → Render.
 * Isso é necessário porque a autenticação só funciona pelo proxy (same-origin).
 *
 * Em desenvolvimento local: usa NEXT_PUBLIC_API_URL ou proxy local via ''.
 */

export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || ''

  // Produção com proxy (Vercel) ou dev com rewrites: usar caminhos relativos
  if (!envUrl) {
    return ''
  }

  return envUrl
}

/** URL direta do backend Render — bypass do proxy Vercel (SSE, uploads grandes). */
export function getDirectApiUrl(): string {
  const renderUrl = process.env.NEXT_PUBLIC_RENDER_API_URL
  if (renderUrl) return renderUrl

  const envUrl = process.env.NEXT_PUBLIC_API_URL || ''
  if (envUrl) return envUrl

  return 'http://localhost:4000'
}

/**
 * URL do endpoint SSE. Em produção conecta direto ao Render (proxy Vercel não suporta streaming).
 * Em dev local usa o proxy do Next.js.
 */
export function getSseUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    if (isLocal) {
      return `${window.location.origin}/api/sse/events`
    }
  }

  return `${getDirectApiUrl()}/api/sse/events`
}
