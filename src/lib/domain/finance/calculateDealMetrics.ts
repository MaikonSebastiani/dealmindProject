import { calculateMonthlyCashFlow } from './cashFlow'
import { calculateROI } from './roi'
import { calculateCapRate } from './capRate'
import { calculatePaybackYears } from './payback'
import { evaluateDealRisk } from './riskEvaluator'

export function calculateDealMetrics(input: {
  purchasePrice: number
  acquisitionCosts: number
  monthlyRent: number
  monthlyExpenses: number
  annualPropertyTax: number
  financing?: {
    downPayment: number
    monthlyInstallment: number
  }
}) {
  const monthlyCashFlow = calculateMonthlyCashFlow({
    monthlyRent: input.monthlyRent,
    monthlyExpenses: input.monthlyExpenses,
    annualPropertyTax: input.annualPropertyTax,
    financingMonthlyInstallment:
      input.financing?.monthlyInstallment ?? 0,
  })

  const annualCashFlow = monthlyCashFlow * 12

  const initialInvestment =
    (input.financing?.downPayment ?? input.purchasePrice) +
    input.acquisitionCosts

  const roi = calculateROI({
    annualCashFlow,
    initialInvestment,
  })

  const capRate = calculateCapRate({
    annualRent: input.monthlyRent * 12,
    annualPropertyTax: input.annualPropertyTax,
    purchasePrice: input.purchasePrice,
  })

  const paybackYears = calculatePaybackYears({
    initialInvestment,
    annualCashFlow,
  })

  const leverageRatio = input.financing
    ? 1 - input.financing.downPayment / input.purchasePrice
    : 0

  const risk = evaluateDealRisk({
    monthlyCashFlow,
    roi,
    leverageRatio,
  })

  return {
    monthlyCashFlow,
    annualCashFlow,
    roi,
    capRate,
    paybackYears,
    risk,
  }
}
