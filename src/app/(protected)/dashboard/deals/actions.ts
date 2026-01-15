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

async function getFileData(formData: FormData, key: string): Promise<{ name: string; data: Uint8Array } | null> {
  const file = formData.get(key)
  if (!file || !(file instanceof File) || file.size === 0) {
    return null
  }

  const arrayBuffer = await file.arrayBuffer()
  return {
    name: file.name,
    data: new Uint8Array(arrayBuffer),
  }
}

export async function createDealAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  const input = getProjectPayload(formData)
  const viability = calculateProjectViability(input)

  // Processar arquivos
  const propertyRegistry = await getFileData(formData, "propertyRegistryFile")
  const auctionNotice = await getFileData(formData, "auctionNoticeFile")

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

      // Documentos
      propertyRegistryFileName: propertyRegistry?.name ?? null,
      propertyRegistryData: propertyRegistry?.data ?? null,
      auctionNoticeFileName: auctionNotice?.name ?? null,
      auctionNoticeData: auctionNotice?.data ?? null,
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

  // Processar arquivos
  const propertyRegistry = await getFileData(formData, "propertyRegistryFile")
  const auctionNotice = await getFileData(formData, "auctionNoticeFile")

  // Flags de deleção
  const deletePropertyRegistry = getString(formData, "deletePropertyRegistry") === "1"
  const deleteAuctionNotice = getString(formData, "deleteAuctionNotice") === "1"

  // Preparar dados de documentos
  const documentData: Record<string, unknown> = {}

  if (propertyRegistry) {
    documentData.propertyRegistryFileName = propertyRegistry.name
    documentData.propertyRegistryData = propertyRegistry.data
  } else if (deletePropertyRegistry) {
    documentData.propertyRegistryFileName = null
    documentData.propertyRegistryData = null
  }

  if (auctionNotice) {
    documentData.auctionNoticeFileName = auctionNotice.name
    documentData.auctionNoticeData = auctionNotice.data
  } else if (deleteAuctionNotice) {
    documentData.auctionNoticeFileName = null
    documentData.auctionNoticeData = null
  }

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

      ...documentData,
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
