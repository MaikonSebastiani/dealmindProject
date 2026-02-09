import type { PeriodOption } from "@/app/(protected)/components/PeriodFilter"

/**
 * Calcula a data de início baseada no período selecionado
 */
export function getPeriodStartDate(period: PeriodOption): Date | null {
  const now = new Date()
  
  switch (period) {
    case "3m": {
      const date = new Date(now)
      date.setMonth(date.getMonth() - 3)
      return date
    }
    case "6m": {
      const date = new Date(now)
      date.setMonth(date.getMonth() - 6)
      return date
    }
    case "12m": {
      const date = new Date(now)
      date.setMonth(date.getMonth() - 12)
      return date
    }
    case "ytd": {
      const date = new Date(now.getFullYear(), 0, 1) // 1º de janeiro do ano atual
      return date
    }
    case "all":
    default:
      return null // Sem filtro de data
  }
}

/**
 * Verifica se uma data está dentro do período selecionado
 */
export function isDateInPeriod(date: Date, period: PeriodOption): boolean {
  const startDate = getPeriodStartDate(period)
  if (!startDate) return true // "all" sempre retorna true
  
  return date >= startDate
}

