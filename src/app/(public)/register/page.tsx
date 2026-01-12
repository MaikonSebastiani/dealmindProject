'use client'

import { useState } from 'react'
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

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950/80 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 text-xl font-bold">
            DM
          </div>
          <CardTitle className="text-2xl text-white">Criar conta</CardTitle>
          <CardDescription className="text-zinc-400">
            Configure seu acesso e comece a analisar oportunidades financeiras
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-zinc-400">
                Nome completo
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome"
                required
                disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

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
                minLength={8}
                disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
              <p className="text-xs text-zinc-500">
                Mínimo de 8 caracteres
              </p>
            </div>

            {error && (
              <p className="text-sm text-rose-400">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-400">
                Conta criada com sucesso! Redirecionando...
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-blue-600 hover:bg-blue-500"
            >
              {isLoading ? 'Criando...' : success ? 'Conta criada!' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-500 hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

