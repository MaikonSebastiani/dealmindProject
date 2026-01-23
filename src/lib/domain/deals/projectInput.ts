export type AmortizationType = "PRICE" | "SAC"
export type PaymentType = "cash" | "installment" | "financing"

export type ProjectInput = {
  acquisition: {
    purchasePrice: number
    downPaymentPercent: number
    auctioneerFeePercent?: number
    advisoryFeePercent?: number  // Porcentagem de assessoria sobre valor de compra
    itbiPercent: number
    registryCost: number
  }
  paymentType: PaymentType
  installment?: {
    installmentsCount: number
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


