'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Mail, Lock, MessageCircle, Zap, Users, BarChart3, Phone } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

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
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Branding impactante */}
      <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen bg-gradient-to-br from-[#1A251F] via-[#2A3A32] to-[#1A251F] flex flex-col justify-start items-center px-6 pt-10 pb-12 lg:pt-14 lg:pb-16 lg:px-12 overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E8B868]/10 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-32 w-64 h-64 rounded-full bg-[#E8B868]/5 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-[#E8B868]/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          {/* Grid sutil */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(232,184,104,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(232,184,104,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className={`relative z-10 max-w-md w-full flex flex-col items-center text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Logo com glow */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 scale-125 bg-white/20 rounded-3xl blur-2xl" />
              <div className="relative w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 drop-shadow-2xl">
                {logoError ? (
                  <div className="w-full h-full rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-2 ring-white/20">
                    <MessageCircle className="w-20 h-20 text-white" />
                  </div>
                ) : (
                  <img
                    src="/images/logo.png?v=3"
                    alt="Logo SOL"
                    className="object-contain w-full h-full drop-shadow-2xl"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Venda mais. <span className="text-[#E8B868]">Responda menos.</span>
          </h1>
          <p className="text-[#E8B868]/80 text-sm sm:text-base mb-8 max-w-sm">
            Centralize conversas, automatize respostas e feche vendas pelo WhatsApp.
          </p>

          {/* Mini features */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
            {[
              { icon: Zap, label: 'Respostas rápidas' },
              { icon: Users, label: 'Contatos organizados' },
              { icon: BarChart3, label: 'Campanhas que vendem' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-[#E8B868]/20 text-white/90 text-sm font-medium"
              >
                <Icon className="w-4 h-4 text-[#E8B868]" />
                {label}
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 text-[#E8B868] text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8B868] animate-pulse shadow-lg shadow-[#E8B868]/50" />
            Conecte seu WhatsApp e comece agora
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="lg:w-1/2 flex items-center justify-center bg-[#F9F6F0] px-6 py-12 lg:py-0">
        <div className={`w-full max-w-md transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-[#2A3A32]/10 border border-[#E8B868]/30 p-8 sm:p-10 hover:shadow-[#E8B868]/20 hover:border-[#E8B868]/60 transition-all duration-300">
            <h2 className="text-2xl font-bold text-[#1A2E22] mb-2">Entrar no SOL</h2>
            <p className="text-[#2A3A32]/70 text-sm mb-8">
              Digite seu email e senha para acessar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 border border-[#394D43]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8B868] focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 border border-[#394D43]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8B868] focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#D4A356] to-[#E8B868] hover:from-[#C39245] hover:to-[#D4A356] text-[#1A2E22] font-bold rounded-xl shadow-lg shadow-[#E8B868]/30 hover:shadow-[#E8B868]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#394D43]/10">
              <p className="text-center text-[#2A3A32]/70 text-sm mb-3">
                Se ainda não tem seus dados de acesso para teste, solicite clicando no botão abaixo.
              </p>
              <a
                href={`https://wa.me/5511992964792?text=${encodeURIComponent('Olá! Gostaria de solicitar os dados de acesso para teste do SOL Instituto.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl border-2 border-[#2A3A32] text-[#2A3A32] font-bold hover:bg-[#2A3A32] hover:text-[#E8B868] transition-all duration-200"
              >
                <Phone className="h-5 w-5" />
                Solicitar dados de acesso
              </a>
            </div>

            <p className="mt-8 text-center text-xs text-[#2A3A32]/50">
              © {new Date().getFullYear()} SOL Instituto Terapêutico — CRM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
