export function evaluateDealRisk(input: {
  monthlyCashFlow: number
  roi: number
  leverageRatio: number
}) {
  return {
    negativeCashFlow: input.monthlyCashFlow < 0,
    lowROI: input.roi < 0.05,
    highLeverage: input.leverageRatio > 0.8,
  }
}
