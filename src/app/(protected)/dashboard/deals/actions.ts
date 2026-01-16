"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { projectInputFormSchema, toProjectInput } from "@/lib/domain/deals/projectInput.schema"
import { calculateProjectViability } from "@/lib/domain/finance/calculateProjectViability"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAIVisionClient } from "@/lib/ai/clients"
import { PROPERTY_REGISTRY_PROMPT, PROPERTY_REGISTRY_SYSTEM } from "@/lib/ai/prompts/property-registry"
import { AUCTION_NOTICE_PROMPT, AUCTION_NOTICE_SYSTEM } from "@/lib/ai/prompts/auction-notice"

function getString(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === "string" ? v.trim() : ""
}

function getProjectPayload(formData: FormData) {
  const raw = getString(formData, "payload")
  const json = raw ? (JSON.parse(raw) as unknown) : null
  const parsed = projectInputFormSchema.parse(json)
  return {
    input: toProjectInput(parsed),
    propertyName: parsed.propertyName,
    propertyType: parsed.propertyType,
  }
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

  const { input, propertyName, propertyType } = getProjectPayload(formData)
  const viability = calculateProjectViability(input)

  // Processar arquivos
  const propertyRegistry = await getFileData(formData, "propertyRegistryFile")
  const auctionNotice = await getFileData(formData, "auctionNoticeFile")

  const initialStatus = "Em análise"

  const deal = await prisma.deal.create({
    data: {
      userId: session.user.id,
      status: initialStatus,
      propertyName,
      propertyType,

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

      renovationCosts: input.renovation?.costs ?? 0,

      resalePrice: input.operationAndExit.resalePrice,
      resaleDiscountPercent: input.operationAndExit.resaleDiscountPercent,
      brokerFeePercent: input.operationAndExit.brokerFeePercent,
      monthlyCondoFee: input.operationAndExit.monthlyCondoFee,
      monthlyIptu: input.operationAndExit.monthlyIptu,
      expectedSaleMonths: input.operationAndExit.expectedSaleMonths,

      monthlyCashFlow: 0,
      annualCashFlow: 0,
      roi: viability.roiAfterTax,
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

      // Registrar histórico inicial de status
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: initialStatus,
        },
      },
    },
    select: { id: true },
  })

  revalidatePath("/dashboard/deals")
  revalidatePath("/dashboard")
  redirect(`/dashboard/deals/${deal.id}`)
}

export async function updateDealAction(dealId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  const { input, propertyName, propertyType } = getProjectPayload(formData)
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
      propertyName,
      propertyType,
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

      renovationCosts: input.renovation?.costs ?? 0,

    resalePrice: input.operationAndExit.resalePrice,
    resaleDiscountPercent: input.operationAndExit.resaleDiscountPercent,
    brokerFeePercent: input.operationAndExit.brokerFeePercent,
    monthlyCondoFee: input.operationAndExit.monthlyCondoFee,
    monthlyIptu: input.operationAndExit.monthlyIptu,
    expectedSaleMonths: input.operationAndExit.expectedSaleMonths,

    monthlyCashFlow: 0,
    annualCashFlow: 0,
      roi: viability.roiAfterTax,
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
  revalidatePath("/dashboard")
  redirect(`/dashboard/deals/${dealId}`)
}

export async function deleteDealAction(dealId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  await prisma.deal.deleteMany({
    where: { id: dealId, userId: session.user.id },
  })

  revalidatePath("/dashboard/deals")
  revalidatePath("/dashboard")
  redirect("/dashboard/deals")
}

export async function updateDealStatusAction(
  dealId: string, 
  newStatus: string,
  monthlyRent?: number
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Não autorizado" }
  }

  const validStatuses = [
    "Em análise",
    "Aprovado",
    "Comprado",
    "Em reforma",
    "Alugado",
    "À venda",
    "Vendido",
    "Arquivado",
  ]

  if (!validStatuses.includes(newStatus)) {
    return { error: "Status inválido" }
  }

  // Se o status for "Alugado", o aluguel mensal é obrigatório
  if (newStatus === "Alugado" && (monthlyRent === undefined || monthlyRent <= 0)) {
    return { error: "Informe o valor do aluguel mensal" }
  }

  // Buscar o status atual do deal
  const currentDeal = await prisma.deal.findFirst({
    where: { id: dealId, userId: session.user.id },
    select: { status: true },
  })

  if (!currentDeal) {
    return { error: "Deal não encontrado" }
  }

  const currentStatus = currentDeal.status

  // Se o status não mudou, não fazer nada
  if (currentStatus === newStatus) {
    return { success: true }
  }

  // Preparar dados adicionais para atualização
  const additionalData: Record<string, unknown> = {}
  
  // Se for "Alugado", salvar o aluguel mensal
  if (newStatus === "Alugado" && monthlyRent) {
    additionalData.monthlyRent = monthlyRent
  }

  // Atualizar o status e registrar no histórico
  await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId },
      data: { 
        status: newStatus,
        ...additionalData,
      },
    }),
    prisma.dealStatusChange.create({
      data: {
        dealId,
        fromStatus: currentStatus,
        toStatus: newStatus,
      },
    }),
  ])

  revalidatePath("/dashboard/deals")
  revalidatePath(`/dashboard/deals/${dealId}`)
  revalidatePath("/dashboard")

  return { success: true }
}

export async function analyzeDealDocumentsAction(dealId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" }
  }

  // Buscar o deal com os documentos
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, userId: session.user.id },
    select: {
      propertyRegistryData: true,
      propertyRegistryFileName: true,
      auctionNoticeData: true,
      auctionNoticeFileName: true,
    },
  })

  if (!deal) {
    return { success: false, error: "Deal não encontrado" }
  }

  const hasPropertyRegistry = deal.propertyRegistryData !== null
  const hasAuctionNotice = deal.auctionNoticeData !== null

  console.log("[AI Analysis] Documentos encontrados:", {
    hasPropertyRegistry,
    hasAuctionNotice,
    propertyRegistryFileName: deal.propertyRegistryFileName,
    auctionNoticeFileName: deal.auctionNoticeFileName,
  })

  if (!hasPropertyRegistry && !hasAuctionNotice) {
    return { success: false, error: "Nenhum documento encontrado para análise" }
  }

  try {
    const aiClient = createAIVisionClient()
    const analysisData: Record<string, unknown> = {}
    let highestConfidence = 0

    // Analisar matrícula se existir
    if (hasPropertyRegistry && deal.propertyRegistryData) {
      console.log("[AI Analysis] Iniciando análise da matrícula...")
      const base64 = Buffer.from(deal.propertyRegistryData).toString("base64")
      
      const response = await aiClient.analyze({
        systemPrompt: PROPERTY_REGISTRY_SYSTEM,
        userPrompt: PROPERTY_REGISTRY_PROMPT,
        imageBase64: base64,
        mimeType: "application/pdf",
      })

      console.log("[AI Analysis] Resposta da matrícula recebida, tamanho:", response.content?.length ?? 0)

      if (response.content) {
        try {
          // Tenta parsear diretamente primeiro (se veio JSON puro)
          const extracted = JSON.parse(response.content)
          analysisData.propertyRegistry = extracted
          if (extracted.confidence > highestConfidence) {
            highestConfidence = extracted.confidence
          }
          console.log("[AI Analysis] Matrícula extraída com sucesso")
        } catch {
          // Se falhar, tenta extrair JSON do texto
          const jsonMatch = response.content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const extracted = JSON.parse(jsonMatch[0])
              analysisData.propertyRegistry = extracted
              if (extracted.confidence > highestConfidence) {
                highestConfidence = extracted.confidence
              }
              console.log("[AI Analysis] Matrícula extraída com sucesso (via regex)")
            } catch (parseError) {
              console.log("[AI Analysis] Erro ao parsear JSON da matrícula:", parseError)
              console.log("[AI Analysis] Conteúdo:", response.content.substring(0, 1000))
            }
          } else {
            console.log("[AI Analysis] Não foi possível extrair JSON da matrícula. Resposta:", response.content.substring(0, 500))
          }
        }
      }
    }

    // Analisar edital se existir
    if (hasAuctionNotice && deal.auctionNoticeData) {
      console.log("[AI Analysis] Iniciando análise do edital...")
      const base64 = Buffer.from(deal.auctionNoticeData).toString("base64")
      
      const response = await aiClient.analyze({
        systemPrompt: AUCTION_NOTICE_SYSTEM,
        userPrompt: AUCTION_NOTICE_PROMPT,
        imageBase64: base64,
        mimeType: "application/pdf",
      })

      console.log("[AI Analysis] Resposta do edital recebida, tamanho:", response.content?.length ?? 0)

      if (response.content) {
        try {
          // Tenta parsear diretamente primeiro (se veio JSON puro)
          const extracted = JSON.parse(response.content)
          analysisData.auctionNotice = extracted
          if (extracted.confidence > highestConfidence) {
            highestConfidence = extracted.confidence
          }
          console.log("[AI Analysis] Edital extraído com sucesso")
        } catch {
          // Se falhar, tenta extrair JSON do texto
          const jsonMatch = response.content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const extracted = JSON.parse(jsonMatch[0])
              analysisData.auctionNotice = extracted
              if (extracted.confidence > highestConfidence) {
                highestConfidence = extracted.confidence
              }
              console.log("[AI Analysis] Edital extraído com sucesso (via regex)")
            } catch (parseError) {
              console.log("[AI Analysis] Erro ao parsear JSON do edital:", parseError)
              console.log("[AI Analysis] Conteúdo:", response.content.substring(0, 1000))
            }
          } else {
            console.log("[AI Analysis] Não foi possível extrair JSON do edital. Resposta:", response.content.substring(0, 500))
          }
        }
      }
    }

    console.log("[AI Analysis] Análise concluída. Dados:", Object.keys(analysisData))

    // Salvar análise no banco
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        aiAnalysisData: JSON.stringify(analysisData),
        aiAnalysisDate: new Date(),
        aiAnalysisConfidence: highestConfidence,
      },
    })

    revalidatePath(`/dashboard/deals/${dealId}`)

    return { 
      success: true, 
      data: analysisData,
    }
  } catch (error) {
    console.error("Erro na análise por IA:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao processar documentos" 
    }
  }
}
