export function calculateROI(input: {
  annualCashFlow: number
  initialInvestment: number
}): number {
  if (input.initialInvestment === 0) {
    throw new Error('Initial investment cannot be zero')
  }

  if (input.annualCashFlow === 0) {
    return 0
  }

  return input.annualCashFlow / input.initialInvestment
}
