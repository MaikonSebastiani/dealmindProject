export function calculateCapRate(input: {
  annualRent: number
  annualPropertyTax: number
  purchasePrice: number
}): number {
  if (input.purchasePrice === 0) {
    return 0
  }

  const netOperatingIncome =
    input.annualRent - input.annualPropertyTax

  if (netOperatingIncome === 0) {
    return 0
  }

  return netOperatingIncome / input.purchasePrice
}
