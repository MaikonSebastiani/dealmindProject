import { describe, it, expect } from 'vitest'
import { calculateMonthlyCashFlow } from '../cashFlow'

describe('Monthly Cash Flow', () => {
  it('calculates positive cash flow for a profitable deal', () => {
    const result = calculateMonthlyCashFlow({
      monthlyRent: 3000,
      monthlyExpenses: 800,
      annualPropertyTax: 1200,
      financingMonthlyInstallment: 900,
    })

    expect(result).toBe(1200)
  })

  it('returns zero when income equals expenses', () => {
    const result = calculateMonthlyCashFlow({
      monthlyRent: 2000,
      monthlyExpenses: 800,
      annualPropertyTax: 2400,
      financingMonthlyInstallment: 1000,
    })

    expect(result).toBe(0)
  })

  it('returns negative cash flow when expenses exceed income', () => {
    const result = calculateMonthlyCashFlow({
      monthlyRent: 1800,
      monthlyExpenses: 900,
      annualPropertyTax: 2400,
      financingMonthlyInstallment: 1200,
    })

    expect(result).toBe(-500)
  })
})
