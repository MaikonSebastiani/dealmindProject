export type AmortizationType = "PRICE" | "SAC"

export type ProjectInput = {
  acquisition: {
    purchasePrice: number
    downPaymentPercent: number
    auctioneerFeePercent?: number
    itbiPercent: number
    registryCost: number
  }
  financing?: {
    enabled: boolean
    interestRateAnnual: number
    termMonths: number
    amortizationType: AmortizationType
  }
  liabilities: {
    iptuDebt: number
    condoDebt: number
  }
  renovation: {
    costs: number
  }
  operationAndExit: {
    resalePrice: number
    resaleDiscountPercent: number
    brokerFeePercent: number
    monthlyCondoFee: number
    monthlyIptu: number
    expectedSaleMonths: number
  }
}


