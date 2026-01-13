"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { projectInputFormSchema, toProjectInput } from "@/lib/domain/deals/projectInput.schema"
import { calculateProjectViability } from "@/lib/domain/finance/calculateProjectViability"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function getString(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === "string" ? v.trim() : ""
}

function getProjectPayload(formData: FormData) {
  const raw = getString(formData, "payload")
  const json = raw ? (JSON.parse(raw) as unknown) : null
  const parsed = projectInputFormSchema.parse(json)
  return toProjectInput(parsed)
}

export async function createDealAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  const input = getProjectPayload(formData)
  const viability = calculateProjectViability(input)

  const deal = await prisma.deal.create({
    data: {
      userId: session.user.id,
      status: "Em análise",

      purchasePrice: input.acquisition.purchasePrice,
      acquisitionCosts: viability.acquisitionCosts,
      monthlyRent: 0,
      monthlyExpenses: 0,
      annualPropertyTax: 0,

      downPaymentPercent: input.acquisition.downPaymentPercent,
      auctioneerFeePercent: input.acquisition.auctioneerFeePercent ?? null,
      itbiPercent: input.acquisition.itbiPercent,
      registryCost: input.acquisition.registryCost,

      financingEnabled: Boolean(input.financing?.enabled),
      interestRateAnnual: input.financing?.interestRateAnnual ?? null,
      termMonths: input.financing?.termMonths ?? null,
      amortizationType: input.financing?.amortizationType ?? null,

      iptuDebt: input.liabilities.iptuDebt,
      condoDebt: input.liabilities.condoDebt,

      resalePrice: input.operationAndExit.resalePrice,
      resaleDiscountPercent: input.operationAndExit.resaleDiscountPercent,
      brokerFeePercent: input.operationAndExit.brokerFeePercent,
      monthlyCondoFee: input.operationAndExit.monthlyCondoFee,
      monthlyIptu: input.operationAndExit.monthlyIptu,
      expectedSaleMonths: input.operationAndExit.expectedSaleMonths,

      monthlyCashFlow: 0,
      annualCashFlow: 0,
      roi: viability.roiTotal,
      capRate: 0,
      paybackYears: 0,
      riskNegativeCashFlow: viability.risk.negativeProfit,
      riskLowROI: viability.risk.lowROI,
      riskHighLeverage: viability.risk.highLeverage,
    },
    select: { id: true },
  })

  revalidatePath("/dashboard/deals")
  redirect(`/dashboard/deals/${deal.id}`)
}

export async function updateDealAction(dealId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  const input = getProjectPayload(formData)
  const viability = calculateProjectViability(input)

  const updated = await prisma.deal.updateMany({
    where: { id: dealId, userId: session.user.id },
    data: {
      purchasePrice: input.acquisition.purchasePrice,
      acquisitionCosts: viability.acquisitionCosts,

      downPaymentPercent: input.acquisition.downPaymentPercent,
      auctioneerFeePercent: input.acquisition.auctioneerFeePercent ?? null,
      itbiPercent: input.acquisition.itbiPercent,
      registryCost: input.acquisition.registryCost,

      financingEnabled: Boolean(input.financing?.enabled),
      interestRateAnnual: input.financing?.interestRateAnnual ?? null,
      termMonths: input.financing?.termMonths ?? null,
      amortizationType: input.financing?.amortizationType ?? null,

      iptuDebt: input.liabilities.iptuDebt,
      condoDebt: input.liabilities.condoDebt,

      resalePrice: input.operationAndExit.resalePrice,
      resaleDiscountPercent: input.operationAndExit.resaleDiscountPercent,
      brokerFeePercent: input.operationAndExit.brokerFeePercent,
      monthlyCondoFee: input.operationAndExit.monthlyCondoFee,
      monthlyIptu: input.operationAndExit.monthlyIptu,
      expectedSaleMonths: input.operationAndExit.expectedSaleMonths,

      monthlyCashFlow: 0,
      annualCashFlow: 0,
      roi: viability.roiTotal,
      capRate: 0,
      paybackYears: 0,
      riskNegativeCashFlow: viability.risk.negativeProfit,
      riskLowROI: viability.risk.lowROI,
      riskHighLeverage: viability.risk.highLeverage,
    },
  })

  if (updated.count === 0) {
    redirect("/dashboard/deals")
  }

  revalidatePath("/dashboard/deals")
  revalidatePath(`/dashboard/deals/${dealId}`)
  redirect(`/dashboard/deals/${dealId}`)
}

export async function deleteDealAction(dealId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  await prisma.deal.deleteMany({
    where: { id: dealId, userId: session.user.id },
  })

  revalidatePath("/dashboard/deals")
  redirect("/dashboard/deals")
}


