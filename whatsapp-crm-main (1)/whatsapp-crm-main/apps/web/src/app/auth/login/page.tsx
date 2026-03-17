'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Credenciais inválidas')
        return
      }

      // Verificar se a sessão foi criada
      const session = await getSession()
      if (session) {
        toast.success('Login realizado com sucesso!')
        router.push('/inbox')
      } else {
        toast.error('Erro ao fazer login')
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Logo do Sol Instituto */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Sol com efeito glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-20 h-20 mx-auto opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-2xl tracking-wider">SOL</span>
              </div>
            </div>
          </div>
          
          {/* Título Principal */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 mb-2">
              SOL INSTITUTO
            </h1>
            <p className="text-lg font-medium text-green-700 mb-1">
              Escola de Formação Profissional
            </p>
            <p className="text-sm text-gray-600 mb-4">
              cursos presenciais e online
            </p>
            
            {/* Sistema CRM */}
            <div className="border-t border-orange-200 pt-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sistema CRM WhatsApp
              </h2>
              <p className="text-sm text-gray-600">
                Faça login para acessar o sistema
              </p>
            </div>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-orange-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-white/70"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-orange-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-white/70"
                placeholder="Senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-orange-200">
            <p className="text-xs text-gray-500">
              Desenvolvido por <span className="font-medium text-orange-600">Deni Morais</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              © 2025 Sol Instituto Terapêutico
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}