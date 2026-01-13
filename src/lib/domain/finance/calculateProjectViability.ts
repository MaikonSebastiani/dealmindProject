import type { ProjectInput } from "@/lib/domain/deals/projectInput"

function toMonthlyRate(interestRateAnnual: number) {
  return interestRateAnnual / 100 / 12
}

function estimatePriceMonthlyPayment(principal: number, monthlyRate: number, termMonths: number) {
  if (termMonths <= 0) return 0
  if (monthlyRate <= 0) return principal / termMonths
  const pow = Math.pow(1 + monthlyRate, -termMonths)
  return (principal * monthlyRate) / (1 - pow)
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function priceBalanceAfterK(principal: number, monthlyRate: number, termMonths: number, k: number, payment: number) {
  if (k <= 0) return principal
  if (monthlyRate <= 0) {
    const amort = principal / termMonths
    return Math.max(0, principal - amort * k)
  }
  const pow = Math.pow(1 + monthlyRate, k)
  return principal * pow - payment * ((pow - 1) / monthlyRate)
}

export function calculateProjectViability(input: ProjectInput) {
  const purchasePrice = input.acquisition.purchasePrice
  const downPayment = (purchasePrice * input.acquisition.downPaymentPercent) / 100

  const itbi = (purchasePrice * input.acquisition.itbiPercent) / 100
  const auctioneerFee = input.acquisition.auctioneerFeePercent
    ? (purchasePrice * input.acquisition.auctioneerFeePercent) / 100
    : 0

  const acquisitionCosts =
    itbi +
    input.acquisition.registryCost +
    auctioneerFee +
    input.liabilities.iptuDebt +
    input.liabilities.condoDebt

  const initialInvestment = downPayment + acquisitionCosts

  const saleGross = input.operationAndExit.resalePrice
  const saleDiscount = (saleGross * input.operationAndExit.resaleDiscountPercent) / 100
  const saleAfterDiscount = saleGross - saleDiscount
  const brokerFee = (saleAfterDiscount * input.operationAndExit.brokerFeePercent) / 100
  const saleNet = saleAfterDiscount - brokerFee

  const expectedSaleMonths = input.operationAndExit.expectedSaleMonths
  const financedPrincipal = Math.max(0, purchasePrice - downPayment)
  const financingEnabled = Boolean(input.financing?.enabled)
  const termMonths = financingEnabled ? input.financing!.termMonths : 0
  const k = financingEnabled ? clampInt(expectedSaleMonths, 0, termMonths) : 0
  const monthlyRate = financingEnabled ? toMonthlyRate(input.financing!.interestRateAnnual) : 0

  const operatingCosts =
    (input.operationAndExit.monthlyCondoFee + input.operationAndExit.monthlyIptu) * expectedSaleMonths

  let interestPaidUntilSale = 0
  let principalPaidUntilSale = 0
  let totalPaidUntilSale = 0
  let remainingBalanceAtSale = 0
  let initialInstallmentEstimate = 0

  if (financingEnabled && financedPrincipal > 0 && termMonths > 0) {
    if (input.financing!.amortizationType === "SAC") {
      const amort = financedPrincipal / termMonths
      initialInstallmentEstimate = amort + financedPrincipal * monthlyRate

      remainingBalanceAtSale = Math.max(0, financedPrincipal - amort * k)
      principalPaidUntilSale = financedPrincipal - remainingBalanceAtSale

      // Σ balance_i for i=0..k-1 where balance_i = P*(1 - i/n)
      // = P * (k - (k-1)k/(2n))
      const sumBalancesFactor = k - (k - 1) * k / (2 * termMonths)
      interestPaidUntilSale = financedPrincipal * monthlyRate * sumBalancesFactor

      totalPaidUntilSale = principalPaidUntilSale + interestPaidUntilSale
    } else {
      // PRICE
      initialInstallmentEstimate = estimatePriceMonthlyPayment(financedPrincipal, monthlyRate, termMonths)
      remainingBalanceAtSale = Math.max(
        0,
        priceBalanceAfterK(financedPrincipal, monthlyRate, termMonths, k, initialInstallmentEstimate),
      )
      principalPaidUntilSale = financedPrincipal - remainingBalanceAtSale
      totalPaidUntilSale = initialInstallmentEstimate * k
      interestPaidUntilSale = Math.max(0, totalPaidUntilSale - principalPaidUntilSale)
    }
  }

  // Cash outflow: entrada + custos iniciais + custos operacionais + pagamentos do financiamento até a venda
  const totalOutflow = initialInvestment + operatingCosts + totalPaidUntilSale

  // Cash inflow at sale: venda líquida - quitação do saldo devedor (se houver)
  const saleNetAfterLoan = financingEnabled ? Math.max(0, saleNet - remainingBalanceAtSale) : saleNet

  const profit = saleNetAfterLoan - totalOutflow

  // Imposto de Renda (estimativa simples): 15% sobre lucro positivo (ganho de capital),
  // sem considerar isenções, abatimentos ou diferenças PF/PJ.
  const incomeTaxRate = 0.15
  const incomeTax = profit > 0 ? profit * incomeTaxRate : 0
  const profitAfterTax = profit - incomeTax

  const roiTotal = totalOutflow > 0 ? profit / totalOutflow : 0
  const roiAnnualized = expectedSaleMonths > 0 ? Math.pow(1 + roiTotal, 12 / expectedSaleMonths) - 1 : 0
  const roiAfterTax = totalOutflow > 0 ? profitAfterTax / totalOutflow : 0

  const leverageHigh = financingEnabled && input.acquisition.downPaymentPercent < 30

  return {
    initialInvestment,
    acquisitionCosts,
    operatingCosts,
    saleNet,
    saleNetAfterLoan,
    totalPaidUntilSale,
    profit,
    roiTotal,
    roiAfterTax,
    roiAnnualized,
    incomeTaxRate,
    incomeTax,
    profitAfterTax,
    financing: financingEnabled
      ? {
          amortizationType: input.financing!.amortizationType,
          interestRateAnnual: input.financing!.interestRateAnnual,
          termMonths: input.financing!.termMonths,
          financedPrincipal,
          monthlyRate,
          initialInstallmentEstimate,
          interestPaidUntilSale,
          principalPaidUntilSale,
          remainingBalanceAtSale,
          monthsConsidered: k,
        }
      : null,
    risk: {
      negativeProfit: profit < 0,
      lowROI: roiAnnualized < 0.1,
      highLeverage: leverageHigh,
    },
  }
}


