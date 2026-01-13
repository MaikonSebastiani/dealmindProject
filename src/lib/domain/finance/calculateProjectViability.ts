import type { ProjectInput } from "@/lib/domain/deals/projectInput"

export function calculateProjectViability(input: ProjectInput) {
  const purchasePrice = input.acquisition.purchasePrice
  const downPayment = (purchasePrice * input.acquisition.downPaymentPercent) / 100

  const itbi = (purchasePrice * input.acquisition.itbiPercent) / 100
  const auctioneerFee = input.acquisition.auctioneerFeePercent
    ? (purchasePrice * input.acquisition.auctioneerFeePercent) / 100
    : 0

  const acquisitionCosts =
    itbi +
    input.acquisition.registryCost +
    auctioneerFee +
    input.liabilities.iptuDebt +
    input.liabilities.condoDebt

  const initialInvestment = downPayment + acquisitionCosts

  const saleGross = input.operationAndExit.resalePrice
  const saleDiscount = (saleGross * input.operationAndExit.resaleDiscountPercent) / 100
  const saleAfterDiscount = saleGross - saleDiscount
  const brokerFee = (saleAfterDiscount * input.operationAndExit.brokerFeePercent) / 100
  const saleNet = saleAfterDiscount - brokerFee

  const expectedSaleMonths = input.operationAndExit.expectedSaleMonths
  const operatingCosts =
    (input.operationAndExit.monthlyCondoFee + input.operationAndExit.monthlyIptu) * expectedSaleMonths

  const totalOutflow = initialInvestment + operatingCosts
  const profit = saleNet - totalOutflow

  const roiTotal = totalOutflow > 0 ? profit / totalOutflow : 0
  const roiAnnualized =
    expectedSaleMonths > 0 ? Math.pow(1 + roiTotal, 12 / expectedSaleMonths) - 1 : 0

  const leverageHigh = Boolean(input.financing?.enabled) && input.acquisition.downPaymentPercent < 30

  return {
    initialInvestment,
    acquisitionCosts,
    operatingCosts,
    saleNet,
    profit,
    roiTotal,
    roiAnnualized,
    risk: {
      negativeProfit: profit < 0,
      lowROI: roiAnnualized < 0.1,
      highLeverage: leverageHigh,
    },
  }
}


