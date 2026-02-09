"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, AlertTriangle, ArrowRight, X } from "lucide-react"
import type { RiskAlert } from "@/lib/dashboard/getRiskAlerts"

interface NotificationsDropdownProps {
  alerts: RiskAlert[]
  readAlertIds: Set<string>
}

export function NotificationsDropdown({ alerts, readAlertIds: initialReadAlertIds }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(initialReadAlertIds)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  // Contar apenas alertas não lidos para o badge
  const unreadAlerts = alerts.filter((alert) => !readAlertIds.has(alert.id))
  const alertCount = unreadAlerts.length

  // Atualizar readAlertIds quando props mudarem
  useEffect(() => {
    setReadAlertIds(initialReadAlertIds)
  }, [initialReadAlertIds])

  const handleAlertClick = async (alertId: string, dealId: string) => {
    // Marcar como lido (apenas atualiza o contador, não remove da lista)
    if (!readAlertIds.has(alertId)) {
      try {
        await fetch("/api/alerts/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        })

        // Adicionar aos lidos localmente (atualiza o contador)
        setReadAlertIds((prev) => new Set([...prev, alertId]))
      } catch (error) {
        console.error("Erro ao marcar alerta como lido:", error)
      }
    }

    // Fechar dropdown e navegar
    setIsOpen(false)
    startTransition(() => {
      router.push(`/dashboard/deals/${dealId}`)
    })
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-lg border border-[#141B29] bg-[#0B0F17] grid place-items-center hover:bg-[#0B1323] transition-colors shrink-0"
      >
        <Bell className="h-4 w-4 text-[#9AA6BC]" />
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF5A6A] border-2 border-[#0B0F17] flex items-center justify-center">
            <span className="text-[10px] font-semibold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay para mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-[90vw] sm:w-96 max-w-md bg-[#0B0F17] border border-[#141B29] rounded-xl shadow-xl z-[100] max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#141B29]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl border border-[#FF5A6A]/30 bg-[#FF5A6A]/10 grid place-items-center">
                  <AlertTriangle className="h-4 w-4 text-[#FF5A6A]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Alertas de Risco</h3>
                  <p className="text-xs text-[#7C889E]">
                    {alertCount} {alertCount === 1 ? "alerta não lido" : "alertas não lidos"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-lg border border-[#141B29] bg-[#0B1323] grid place-items-center hover:bg-[#0B1323]/80 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-[#7C889E]" />
              </button>
            </div>

            {/* Alerts List */}
            <div className="overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#0B1323] border border-[#141B29] grid place-items-center mx-auto mb-3">
                    <Bell className="h-6 w-6 text-[#7C889E]" />
                  </div>
                  <p className="text-sm text-white font-medium mb-1">Nenhum alerta</p>
                  <p className="text-xs text-[#7C889E]">Todos os deals estão em ordem</p>
                </div>
              ) : (
                <div className="p-2">
                  {alerts.map((alert) => {
                    const isRead = readAlertIds.has(alert.id)
                    return (
                      <button
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id, alert.dealId)}
                        disabled={isPending}
                        className={`w-full text-left p-3 rounded-lg border border-[#141B29] transition-colors mb-2 last:mb-0 group disabled:opacity-50 disabled:cursor-not-allowed ${
                          isRead
                            ? "bg-[#0B1323]/50 opacity-60"
                            : "bg-[#0B1323] hover:bg-[#0B1323]/80"
                        }`}
                      >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-medium ${
                                alert.severity === "high"
                                  ? "text-[#FF5A6A]"
                                  : alert.severity === "medium"
                                    ? "text-[#F59E0B]"
                                    : "text-[#7C889E]"
                              }`}
                            >
                              {alert.title}
                            </span>
                            {alert.severity === "high" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A6A] shrink-0" />
                            )}
                          </div>
                          <div className="text-sm text-white font-medium truncate mb-1">
                            {alert.dealName}
                          </div>
                          <div className="text-xs text-[#7C889E] line-clamp-2">
                            {alert.description}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#7C889E] group-hover:text-[#4F7DFF] transition-colors shrink-0 mt-1" />
                      </div>
                    </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="p-3 border-t border-[#141B29]">
                <Link
                  href="/dashboard/deals"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center text-xs text-[#4F7DFF] hover:text-[#2D5BFF] transition-colors"
                >
                  Ver todos os deals
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

