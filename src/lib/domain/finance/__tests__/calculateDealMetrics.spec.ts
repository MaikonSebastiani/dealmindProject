import { describe, it, expect } from 'vitest'
import { calculateDealMetrics } from '../calculateDealMetrics'

describe('Calculate Deal Metrics (Facade)', () => {
  it('returns consistent financial metrics for a simple deal', () => {
    const result = calculateDealMetrics({
      purchasePrice: 300000,
      acquisitionCosts: 15000,
      monthlyRent: 3000,
      monthlyExpenses: 800,
      annualPropertyTax: 1200,
      financing: {
        downPayment: 60000,
        monthlyInstallment: 1500,
      },
    })

    expect(result.monthlyCashFlow).toBeGreaterThan(0)
    expect(result.roi).toBeGreaterThan(0)
    expect(result.capRate).toBeGreaterThan(0)
    expect(result.paybackYears).toBeGreaterThan(0)
    expect(result.risk).toBeDefined()
  })
})
