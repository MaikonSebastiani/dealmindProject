import { describe, it, expect } from 'vitest'
import { calculateCapRate } from '../capRate'

describe('Cap Rate', () => {
  it('calculates cap rate ignoring financing', () => {
    const capRate = calculateCapRate({
      annualRent: 36000,
      annualPropertyTax: 3000,
      purchasePrice: 400000,
    })

    expect(capRate).toBeCloseTo(0.0825, 4)
  })

  it('returns zero if net operating income is zero', () => {
    const capRate = calculateCapRate({
      annualRent: 12000,
      annualPropertyTax: 12000,
      purchasePrice: 300000,
    })

    expect(capRate).toBe(0)
  })
})
