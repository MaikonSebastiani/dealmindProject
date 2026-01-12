import { describe, it, expect } from 'vitest'
import { calculateROI } from '../roi'

describe('ROI (Return on Investment)', () => {
  it('calculates ROI based on annual cash flow and initial investment', () => {
    const roi = calculateROI({
      annualCashFlow: 24000,
      initialInvestment: 200000,
    })

    expect(roi).toBeCloseTo(0.12, 2)
  })

  it('returns zero when cash flow is zero', () => {
    const roi = calculateROI({
      annualCashFlow: 0,
      initialInvestment: 150000,
    })

    expect(roi).toBe(0)
  })

  it('throws error when initial investment is zero', () => {
    expect(() =>
      calculateROI({
        annualCashFlow: 10000,
        initialInvestment: 0,
      })
    ).toThrow()
  })
})
