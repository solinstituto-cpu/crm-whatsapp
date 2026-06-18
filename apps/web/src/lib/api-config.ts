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
