import { activeStatuses, type DealStatus } from "@/lib/domain/deals/dealStatus"

type DealForProfit = {
  status: string
  resalePrice: number | null
  purchasePrice: number
  acquisitionCosts: number | null
  monthlyCondoFee: number | null
  monthlyIptu: number | null
  brokerFeePercent: number | null
  expectedSaleMonths: number
  renovationCosts: number | null
}

/**
 * Calcula o lucro projetado de deals ativos
 * Baseado na fórmula de lucro: resalePrice - purchasePrice - costs - taxes
 */
export function calculateProjectedProfit(deals: DealForProfit[]): number {
  const activeDeals = deals.filter((d) => activeStatuses.includes(d.status as DealStatus))

  return activeDeals.reduce((acc, deal) => {
    const resalePrice = deal.resalePrice ?? 0
    if (resalePrice <= 0) return acc

    // Custos de manutenção durante período de venda
    const holdingCosts =
      ((deal.monthlyCondoFee ?? 0) + (deal.monthlyIptu ?? 0)) * deal.expectedSaleMonths

    // Taxa de corretagem
    const brokerFee = ((deal.brokerFeePercent ?? 0) / 100) * resalePrice

    // Custos de reforma
    const renovationCosts = deal.renovationCosts ?? 0

    // Lucro projetado
    const projectedProfit =
      resalePrice -
      deal.purchasePrice -
      (deal.acquisitionCosts ?? 0) -
      holdingCosts -
      brokerFee -
      renovationCosts

    return acc + Math.max(0, projectedProfit)
  }, 0)
}

/**
 * Calcula o lucro realizado de deals vendidos
 * Reutiliza a mesma lógica do dashboard
 */
export function calculateRealizedProfit(deals: DealForProfit[]): number {
  const soldDeals = deals.filter((d) => d.status === "Vendido")

  return soldDeals.reduce((acc, deal) => {
    const resalePrice = deal.resalePrice ?? 0
    if (resalePrice <= 0) return acc

    const holdingCosts =
      ((deal.monthlyCondoFee ?? 0) + (deal.monthlyIptu ?? 0)) * deal.expectedSaleMonths
    const brokerFee = ((deal.brokerFeePercent ?? 0) / 100) * resalePrice
    const renovationCosts = deal.renovationCosts ?? 0

    const profit =
      resalePrice -
      deal.purchasePrice -
      (deal.acquisitionCosts ?? 0) -
      holdingCosts -
      brokerFee -
      renovationCosts

    return acc + Math.max(0, profit)
  }, 0)
}

/**
 * Compara lucro realizado vs projetado
 */
export function compareProfit(realized: number, projected: number) {
  if (projected === 0) {
    return {
      difference: realized,
      differencePercent: realized > 0 ? 100 : 0,
      isAboveProjection: realized > 0,
    }
  }

  const difference = realized - projected
  const differencePercent = (difference / projected) * 100

  return {
    difference,
    differencePercent,
    isAboveProjection: difference > 0,
  }
}

