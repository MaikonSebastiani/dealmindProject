/**
 * Tipos para o sistema de geração de relatórios PDF
 */

export type ReportType = 'portfolio' | 'deal' | 'performance' | 'viability'

export interface PortfolioReportData {
  user: {
    name: string | null
    email: string
  }
  generatedAt: Date
  period?: string
  status?: string
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

export interface ViabilityReportData {
  user: {
    name: string | null
    email: string
  }
  generatedAt: Date
  deal: {
    id: string
    propertyName: string | null
    propertyType: string | null
    address: string | null
    propertyLink: string | null
    status: string
  }
  viability: {
    status: 'Viável' | 'Margem apertada' | 'Inviável'
    detail: string
    /** ROI sobre o investimento necessário (capital investido), já com desconto de IR */
    roiOnInitialInvestmentAfterTax: number
    roiAfterTax?: number
    profit: number
    profitAfterTax: number
    initialInvestment: number
    acquisitionCosts: number
    renovationCosts: number
    evacuationCosts: number
    operatingCosts: number
    saleNet: number
    saleNetAfterLoan: number
    totalPaidUntilSale: number
    incomeTax: number
    incomeTaxRate: number
    financing?: {
      amortizationType: string
      interestRateAnnual: number
      termMonths: number
      financedPrincipal: number
      initialInstallmentEstimate: number
      interestPaidUntilSale: number
      principalPaidUntilSale: number
      remainingBalanceAtSale: number
      monthsConsidered: number
    } | null
    installment?: {
      installmentsCount: number
      monthlyInstallment: number
      totalPaidUntilSale: number
      remainingBalanceAtSale: number
    } | null
    paymentType: 'cash' | 'financing' | 'installment'
    risk: {
      negativeProfit: boolean
      lowROI: boolean
      highLeverage: boolean
    }
  }
  dealDetails: {
    purchasePrice: number
    downPaymentPercent: number
    downPaymentValue: number
    resalePrice: number
    resaleDiscountPercent: number
    expectedSaleMonths: number
    monthlyCondoFee: number
    monthlyIptu: number
    /** ROI esperado pelo usuário (%); base do diagnóstico de viabilidade */
    expectedRoiPercent: number
  }
  costsBreakdown: {
    itbi: number
    registryCost: number
    auctioneerFee: number
    advisoryFee: number
    iptuDebt: number
    condoDebt: number
    renovationCosts: number
    evacuationCosts: number
    operatingCosts: {
      condoTotal: number
      iptuTotal: number
    }
    financing?: {
      principalPaid: number
      interestPaid: number
    }
    installment?: {
      totalPaid: number
    }
    saleCosts: {
      discount: number
      brokerFee: number
    }
  }
}

