"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export type PeriodOption = "all" | "3m" | "6m" | "12m" | "ytd"

const periodOptions: { value: PeriodOption; label: string }[] = [
  { value: "all", label: "Todo o período" },
  { value: "ytd", label: "Ano atual" },
  { value: "12m", label: "Últimos 12 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "3m", label: "Últimos 3 meses" },
]

export function PeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = (searchParams.get("period") as PeriodOption) || "12m"

  const handlePeriodChange = (period: PeriodOption) => {
    const params = new URLSearchParams(searchParams.toString())
    if (period === "12m") {
      // 12m é o padrão, então removemos o parâmetro
      params.delete("period")
    } else {
      params.set("period", period)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-[#7C889E] shrink-0" />
      <div className="flex items-center gap-1 overflow-x-auto">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => handlePeriodChange(option.value)}
            className={`
              h-7 px-2.5 text-xs whitespace-nowrap
              ${
                currentPeriod === option.value
                  ? "bg-[#4F7DFF]/10 text-[#4F7DFF] border border-[#4F7DFF]/30"
                  : "text-[#7C889E] hover:text-white hover:bg-[#0B1323]"
              }
            `}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

