/**
 * API Route para gerar relatório de viabilidade em PDF
 * Analisa a viabilidade de um imóvel específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { generateReport } from '@/lib/pdf/generateReport'
import { calculateProjectViability } from '@/lib/domain/finance/calculateProjectViability'
import { logger } from '@/lib/logger'
import type { ViabilityReportData } from '@/lib/pdf/types'
import type { ProjectInput } from '@/lib/domain/deals/projectInput'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Obter dealId da query string
    const { searchParams } = new URL(req.url)
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json(
        { error: 'dealId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Buscar deal do usuário
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        userId: session.user.id,
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Inferir paymentType baseado nos dados existentes
    const paymentType: "cash" | "installment" | "financing" = 
      deal.financingEnabled 
        ? "financing" 
        : (deal.termMonths && deal.termMonths > 0 && !deal.financingEnabled)
          ? "installment"
          : "cash"
    
    // Calcular valor restante para verificar se faz sentido ter parcelamento
    const remainingAmount = deal.purchasePrice - ((deal.purchasePrice * (deal.downPaymentPercent ?? 0)) / 100)
    const hasRemainingAmount = remainingAmount > 0
    
    const projectInput: ProjectInput = {
      expectedRoiPercent: deal.expectedRoiPercent ?? 10,
      acquisition: {
        purchasePrice: deal.purchasePrice,
        downPaymentPercent: deal.downPaymentPercent ?? 0,
        auctioneerFeePercent: deal.auctioneerFeePercent ?? undefined,
        advisoryFeePercent: deal.advisoryFeePercent ?? undefined,
        itbiPercent: deal.itbiPercent ?? 0,
        registryCost: deal.registryCost ?? 0,
      },
      paymentType,
      installment: paymentType === "installment" && deal.termMonths && deal.termMonths > 0 && hasRemainingAmount
        ? { installmentsCount: deal.termMonths } 
        : undefined,
      financing: deal.financingEnabled
        ? {
            enabled: true,
            interestRateAnnual: deal.interestRateAnnual ?? 0,
            termMonths: deal.termMonths ?? 0,
            amortizationType: (deal.amortizationType === "SAC" ? "SAC" : "PRICE") as "SAC" | "PRICE",
          }
        : undefined,
      liabilities: {
        iptuDebt: deal.iptuDebt ?? 0,
        condoDebt: deal.condoDebt ?? 0,
      },
      renovation: {
        costs: deal.renovationCosts ?? 0,
      },
      evacuation: {
        costs: deal.evacuationCosts ?? 0,
      },
      operationAndExit: {
        resalePrice: deal.resalePrice ?? 0,
        resaleDiscountPercent: deal.resaleDiscountPercent ?? 0,
        brokerFeePercent: deal.brokerFeePercent ?? 0,
        monthlyCondoFee: deal.monthlyCondoFee ?? 0,
        monthlyIptu: deal.monthlyIptu ?? 0,
        expectedSaleMonths: deal.expectedSaleMonths ?? 12,
      },
    }

    const viability = calculateProjectViability(projectInput)

    // Determinar status de viabilidade
    const viabilityStatus = viability.viabilityStatus
    const viabilityDetail = viability.viabilityDetail

    const downPaymentValue = (deal.purchasePrice * (deal.downPaymentPercent ?? 0)) / 100

    // Calcular valores individuais de cada gasto
    const itbiValue = (deal.purchasePrice * (deal.itbiPercent ?? 0)) / 100
    const auctioneerFeeValue = deal.auctioneerFeePercent
      ? (deal.purchasePrice * deal.auctioneerFeePercent) / 100
      : 0
    const advisoryFeeValue = deal.advisoryFeePercent
      ? (deal.purchasePrice * deal.advisoryFeePercent) / 100
      : 0
    const saleDiscountValue = (deal.resalePrice ?? 0) * ((deal.resaleDiscountPercent ?? 0) / 100)
    const saleAfterDiscount = (deal.resalePrice ?? 0) - saleDiscountValue
    const brokerFeeValue = saleAfterDiscount * ((deal.brokerFeePercent ?? 0) / 100)
    const expectedSaleMonths = deal.expectedSaleMonths ?? 12
    const condoTotal = (deal.monthlyCondoFee ?? 0) * expectedSaleMonths
    const iptuTotal = (deal.monthlyIptu ?? 0) * expectedSaleMonths

    // Preparar dados para o relatório
    const reportData: ViabilityReportData = {
      user: {
        name: user.name,
        email: user.email,
      },
      generatedAt: new Date(),
      deal: {
        id: deal.id,
        propertyName: deal.propertyName,
        propertyType: deal.propertyType,
        address: deal.address,
        propertyLink: deal.propertyLink ?? null,
        status: deal.status,
      },
      viability: {
        status: viabilityStatus,
        detail: viabilityDetail,
        roiOnInitialInvestmentAfterTax: viability.roiOnInitialInvestmentAfterTax,
        profit: viability.profit,
        profitAfterTax: viability.profitAfterTax,
        initialInvestment: viability.initialInvestment,
        acquisitionCosts: viability.acquisitionCosts,
        renovationCosts: viability.renovationCosts,
        evacuationCosts: viability.evacuationCosts,
        operatingCosts: viability.operatingCosts,
        saleNet: viability.saleNet,
        saleNetAfterLoan: viability.saleNetAfterLoan,
        totalPaidUntilSale: viability.totalPaidUntilSale,
        incomeTax: viability.incomeTax,
        incomeTaxRate: viability.incomeTaxRate,
        financing: viability.financing,
        installment: viability.installment,
        paymentType: viability.paymentType,
        risk: viability.risk,
      },
      dealDetails: {
        purchasePrice: deal.purchasePrice,
        downPaymentPercent: deal.downPaymentPercent ?? 0,
        downPaymentValue,
        resalePrice: deal.resalePrice ?? 0,
        resaleDiscountPercent: deal.resaleDiscountPercent ?? 0,
        expectedSaleMonths: deal.expectedSaleMonths ?? 12,
        monthlyCondoFee: deal.monthlyCondoFee ?? 0,
        monthlyIptu: deal.monthlyIptu ?? 0,
        expectedRoiPercent: deal.expectedRoiPercent ?? 10,
      },
      costsBreakdown: {
        itbi: itbiValue,
        registryCost: deal.registryCost ?? 0,
        auctioneerFee: auctioneerFeeValue,
        advisoryFee: advisoryFeeValue,
        iptuDebt: deal.iptuDebt ?? 0,
        condoDebt: deal.condoDebt ?? 0,
        renovationCosts: deal.renovationCosts ?? 0,
        evacuationCosts: deal.evacuationCosts ?? 0,
        operatingCosts: {
          condoTotal,
          iptuTotal,
        },
        financing: viability.financing ? {
          principalPaid: viability.financing.principalPaidUntilSale,
          interestPaid: viability.financing.interestPaidUntilSale,
        } : undefined,
        installment: viability.installment ? {
          totalPaid: viability.installment.totalPaidUntilSale,
        } : undefined,
        saleCosts: {
          discount: saleDiscountValue,
          brokerFee: brokerFeeValue,
        },
      },
    }

    // Gerar PDF
    const pdfBuffer = await generateReport('viability', reportData)

    // Retornar PDF como resposta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-viabilidade-${deal.propertyName?.replace(/[^a-z0-9]/gi, '-') || deal.id}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Erro ao gerar relatório de viabilidade', error, undefined, 'PDF')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

