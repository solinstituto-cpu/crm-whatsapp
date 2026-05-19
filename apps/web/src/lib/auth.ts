import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Chamar API do backend para validar credenciais
          // API_URL no server; fallback para produção quando na Vercel
          const apiUrl =
            process.env.API_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            (process.env.VERCEL ? 'https://crm-api-laxv.onrender.com' : 'http://localhost:4000')
          // Timeout 90s (Render free tier demora ~50s para "acordar")
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 90000)
            const response = await fetch(`${apiUrl}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
              signal: controller.signal,
            })
            clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            // Backend retorna { access_token, user: { id, email, name, role } }
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              accessToken: data.access_token,
            }
          }

          // Se falhar, retornar null
          return null
        } catch (error) {
          console.error('Erro ao autenticar:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.token = token.accessToken
        session.accessToken = token.accessToken
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }