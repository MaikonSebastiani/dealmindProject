'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

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
        setError('Email ou senha incorretos')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950/80 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 text-xl font-bold">
            DM
          </div>
          <CardTitle className="text-2xl text-white">Entrar no DealMind</CardTitle>
          <CardDescription className="text-zinc-400">
            Acesse sua plataforma de análise de investimentos imobiliários
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-zinc-400">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@email.com"
                required
                disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-zinc-400">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full border-zinc-800 text-white hover:bg-zinc-900"
          >
            Entrar com Google
          </Button>

          <p className="text-center text-sm text-zinc-500">
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-500 hover:underline">
              Criar agora
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

