/**
 * Tipos para o sistema de geração de relatórios PDF
 */

export type ReportType = 'portfolio' | 'deal' | 'performance'

export interface PortfolioReportData {
  user: {
    name: string | null
    email: string
  }
  generatedAt: Date
  metrics: {
    totalDeals: number
    portfolioDeals: number
    pipelineCount: number
    pipelineValue: number
    portfolioValue: number
    soldCount: number
    rentingCount: number
    totalRentIncome: number
    rentabilidadeAnual: number
    rentabilidadeTotal: number
    mesesInvestindo: number
  }
  deals: Array<{
    id: string
    propertyName: string | null
    propertyType: string | null
    address: string | null
    status: string
    purchasePrice: number
    acquisitionCosts: number
    roi: number
    monthlyCashFlow: number
    monthlyRent: number | null
    resalePrice: number | null
  }>
}

export interface PerformanceReportData {
  user: {
    name: string | null
    email: string
  }
  generatedAt: Date
  metrics: {
    averageROI: number
    totalMonthlyCashFlow: number
    saleRate: number
    totalDeals: number
    portfolioDeals: number
    dealsForSale: number
    soldDeals: number
    saleTime: {
      averageMonths: number | null
      totalSales: number
    }
    realizedProfit: number
  }
}

