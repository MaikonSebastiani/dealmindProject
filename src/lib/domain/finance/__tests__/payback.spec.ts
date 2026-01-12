import { describe, it, expect } from 'vitest'
import { calculatePaybackYears } from '../payback'

describe('Payback Period', () => {
  it('calculates payback in years', () => {
    const years = calculatePaybackYears({
      initialInvestment: 200000,
      annualCashFlow: 20000,
    })

    expect(years).toBe(10)
  })

  it('returns Infinity when annual cash flow is zero', () => {
    const years = calculatePaybackYears({
      initialInvestment: 150000,
      annualCashFlow: 0,
    })

    expect(years).toBe(Infinity)
  })
})
