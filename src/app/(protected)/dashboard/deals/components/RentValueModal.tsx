"use client"

import { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function sanitizeToDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function RentValueModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (monthlyRent: number) => void
  isPending: boolean
}) {
  const [rentValue, setRentValue] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = sanitizeToDigits(e.target.value).slice(0, 15)
    if (!digits) {
      setRentValue("")
      return
    }
    const cents = Number(digits)
    if (!Number.isFinite(cents)) return
    setRentValue(formatter.format(cents / 100))
  }

  const handleConfirm = () => {
    const value = parseFloat(rentValue.replace(/\./g, "").replace(",", "."))
    if (Number.isFinite(value) && value > 0) {
      onConfirm(value)
    }
  }

  const parsedValue = parseFloat(rentValue.replace(/\./g, "").replace(",", "."))
  const isValid = Number.isFinite(parsedValue) && parsedValue > 0

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop com blur - cobre tudo */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal centralizado */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-[#141B29] bg-[#0B0F17] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#141B29] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/40">
                <Key className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Valor do Aluguel</h2>
                <p className="text-sm text-[#7C889E]">Informe o aluguel mensal do imóvel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#7C889E] hover:bg-[#141B29] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <label htmlFor="monthlyRent" className="block text-sm text-[#9AA6BC] mb-2">
              Aluguel mensal
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#7C889E]">
                R$
              </span>
              <Input
                id="monthlyRent"
                inputMode="numeric"
                type="text"
                value={rentValue}
                onChange={handleInputChange}
                className="h-14 bg-[#05060B] border-[#141B29] text-white text-xl font-semibold placeholder-[#7C889E] pl-12 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#A855F7]"
                placeholder="0,00"
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-[#7C889E]">
              Este valor será usado para calcular a renda passiva no dashboard.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[#141B29] px-6 py-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isPending}
              className="bg-[#A855F7] hover:bg-[#9333EA] text-white"
            >
              {isPending ? "Salvando..." : "Confirmar aluguel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Renderiza no body via portal para garantir que fique acima de tudo
  return createPortal(modalContent, document.body)
}

