export function calculatePaybackYears(input: {
  initialInvestment: number
  annualCashFlow: number
}): number {
  if (input.annualCashFlow === 0) {
    return Infinity
  }

  return input.initialInvestment / input.annualCashFlow
}
