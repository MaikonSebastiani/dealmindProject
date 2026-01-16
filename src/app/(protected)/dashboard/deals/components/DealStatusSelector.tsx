"use client"

import { useState, useTransition } from "react"
import { ChevronDown, Check, Search, Home, Hammer, Key, Tag, BadgeCheck, Archive } from "lucide-react"
import { updateDealStatusAction } from "../actions"
import {
  dealStatuses,
  dealStatusConfig,
  validStatusTransitions,
  type DealStatus,
} from "@/lib/domain/deals/dealStatus"
import { RentValueModal } from "./RentValueModal"

const iconMap = {
  search: Search,
  check: Check,
  home: Home,
  hammer: Hammer,
  key: Key,
  tag: Tag,
  "badge-check": BadgeCheck,
  archive: Archive,
}

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  gray: {
    bg: "bg-[#0B1323]",
    text: "text-[#9AA6BC]",
    border: "border-[#141B29]",
  },
  blue: {
    bg: "bg-[#0B1323]",
    text: "text-[#4F7DFF]",
    border: "border-[#1E3A5F]",
  },
  green: {
    bg: "bg-[#06221B]",
    text: "text-[#32D583]",
    border: "border-[#0B3A2C]",
  },
  yellow: {
    bg: "bg-[#1F1B05]",
    text: "text-[#F59E0B]",
    border: "border-[#3D3A0A]",
  },
  purple: {
    bg: "bg-[#1A0B2E]",
    text: "text-[#A855F7]",
    border: "border-[#2E1065]",
  },
  orange: {
    bg: "bg-[#1F1206]",
    text: "text-[#F97316]",
    border: "border-[#3D2409]",
  },
  emerald: {
    bg: "bg-[#022C22]",
    text: "text-[#10B981]",
    border: "border-[#065F46]",
  },
  red: {
    bg: "bg-[#2A0B12]",
    text: "text-[#FF5A6A]",
    border: "border-[#3A0B16]",
  },
}

export function DealStatusSelector({
  dealId,
  currentStatus,
}: {
  dealId: string
  currentStatus: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus as DealStatus)
  const [showRentModal, setShowRentModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<DealStatus | null>(null)

  const config = dealStatusConfig[status] ?? dealStatusConfig["Em análise"]
  const colors = colorClasses[config.color]
  const Icon = iconMap[config.icon]

  const availableTransitions = validStatusTransitions[status] ?? []

  const handleStatusChange = (newStatus: DealStatus) => {
    setIsOpen(false)
    
    // Se o status for "Alugado", mostrar modal para informar o aluguel
    if (newStatus === "Alugado") {
      setPendingStatus(newStatus)
      setShowRentModal(true)
      return
    }

    // Para outros status, atualizar normalmente
    executeStatusChange(newStatus)
  }

  const executeStatusChange = (newStatus: DealStatus, monthlyRent?: number) => {
    startTransition(async () => {
      const result = await updateDealStatusAction(dealId, newStatus, monthlyRent)
      if (result && result.success) {
        setStatus(newStatus)
      }
    })
  }

  const handleRentConfirm = (monthlyRent: number) => {
    if (pendingStatus) {
      executeStatusChange(pendingStatus, monthlyRent)
      setShowRentModal(false)
      setPendingStatus(null)
    }
  }

  const handleRentCancel = () => {
    setShowRentModal(false)
    setPendingStatus(null)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending || availableTransitions.length === 0}
          className={`
            inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium
            transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
            ${colors.bg} ${colors.text} ${colors.border}
          `}
        >
          <Icon className="h-4 w-4" />
          <span>{isPending ? "Atualizando..." : config.label}</span>
          {availableTransitions.length > 0 && (
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          )}
        </button>

        {isOpen && availableTransitions.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border border-[#141B29] bg-[#0B0F17] shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[#141B29]">
                <div className="text-xs text-[#7C889E]">Alterar status para</div>
              </div>
              <div className="py-1">
                {availableTransitions.map((nextStatus) => {
                  const nextConfig = dealStatusConfig[nextStatus]
                  const nextColors = colorClasses[nextConfig.color]
                  const NextIcon = iconMap[nextConfig.icon]

                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#0B1323] transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-lg ${nextColors.bg} ${nextColors.border} border flex items-center justify-center`}>
                        <NextIcon className={`h-4 w-4 ${nextColors.text}`} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-white">{nextConfig.label}</div>
                        <div className="text-xs text-[#7C889E]">{nextConfig.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal para informar o valor do aluguel */}
      <RentValueModal
        isOpen={showRentModal}
        onClose={handleRentCancel}
        onConfirm={handleRentConfirm}
        isPending={isPending}
      />
    </>
  )
}

// Componente estático para exibir o status (sem dropdown)
export function DealStatusBadge({ status }: { status: string }) {
  const config = dealStatusConfig[status as DealStatus] ?? dealStatusConfig["Em análise"]
  const colors = colorClasses[config.color]
  const Icon = iconMap[config.icon]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium
        ${colors.bg} ${colors.text} ${colors.border}
      `}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

