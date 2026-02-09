/**
 * API Route para gerar relatório de portfólio em PDF
 * Reutiliza lógica de cálculo do dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { generateReport } from '@/lib/pdf/generateReport'
import { pipelineStatuses, activeStatuses, type DealStatus } from '@/lib/domain/deals/dealStatus'
import { logger } from '@/lib/logger'
import type { PortfolioReportData } from '@/lib/pdf/types'

// Função para calcular lucro de um deal vendido (reutilizada do dashboard)
function calculateDealProfit(deal: {
  purchasePrice: number
  resalePrice: number | null
  acquisitionCosts: number
  monthlyCondoFee: number | null
  monthlyIptu: number | null
  brokerFeePercent: number | null
  expectedSaleMonths: number
}): number {
  const resalePrice = deal.resalePrice ?? 0
  if (resalePrice <= 0) return 0

  const holdingCosts = ((deal.monthlyCondoFee ?? 0) + (deal.monthlyIptu ?? 0)) * deal.expectedSaleMonths
  const brokerFee = (deal.brokerFeePercent ?? 0) / 100 * resalePrice

  return Math.max(0, resalePrice - deal.purchasePrice - deal.acquisitionCosts - holdingCosts - brokerFee)
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Buscar TODOS os deals (sem filtro de período)
    const deals = await prisma.deal.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        propertyName: true,
        propertyType: true,
        address: true,
        status: true,
        purchasePrice: true,
        resalePrice: true,
        acquisitionCosts: true,
        monthlyCondoFee: true,
        monthlyIptu: true,
        brokerFeePercent: true,
        expectedSaleMonths: true,
        roi: true,
        monthlyCashFlow: true,
        monthlyRent: true,
        createdAt: true,
      },
    })

    const totalDeals = deals.length

    // Pipeline: Em análise + Aprovado
    const pipelineDeals = deals.filter(d => pipelineStatuses.includes(d.status as DealStatus))
    const pipelineCount = pipelineDeals.length
    const pipelineValue = pipelineDeals.reduce((acc, d) => acc + d.purchasePrice, 0)

    // Portfólio Ativo: Comprado + Em reforma + Alugado + À venda
    const portfolioDeals = deals.filter(d => activeStatuses.includes(d.status as DealStatus))
    const portfolioCount = portfolioDeals.length
    const portfolioValue = portfolioDeals.reduce((acc, d) => acc + d.purchasePrice + (d.acquisitionCosts ?? 0), 0)

    // Vendidos
    const soldDeals = deals.filter(d => d.status === "Vendido")
    const soldCount = soldDeals.length

    // Alugados
    const rentingDeals = deals.filter(d => d.status === "Alugado")
    const rentingCount = rentingDeals.length
    const totalRentIncome = rentingDeals.reduce((acc, d) => acc + (d.monthlyRent ?? 0), 0)

    // Calcular Rentabilidade
    let rentabilidadeAnual = 0
    let rentabilidadeTotal = 0
    let mesesInvestindo = 0

    const primeiraCompra = await prisma.dealStatusChange.findFirst({
      where: {
        deal: { userId: session.user.id },
        toStatus: "Comprado",
      },
      orderBy: { changedAt: "asc" },
    })

    if (primeiraCompra) {
      const dataInicio = primeiraCompra.changedAt
      const agora = new Date()
      mesesInvestindo = Math.max(1, Math.round(
        (agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ))

      const lucroRealizado = soldDeals.reduce((acc, d) => acc + calculateDealProfit(d), 0)

      const comprasIniciais = await prisma.dealStatusChange.findMany({
        where: {
          deal: { userId: session.user.id },
          toStatus: "Comprado",
          changedAt: {
            lte: new Date(dataInicio.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          deal: { select: { purchasePrice: true, acquisitionCosts: true } },
        },
      })

      const capitalInicial = comprasIniciais.reduce(
        (acc, c) => acc + c.deal.purchasePrice + c.deal.acquisitionCosts,
        0
      )

      if (capitalInicial > 0) {
        const patrimonioAtual = portfolioValue + lucroRealizado
        rentabilidadeTotal = (patrimonioAtual / capitalInicial) - 1

        if (mesesInvestindo >= 1) {
          rentabilidadeAnual = Math.pow(1 + rentabilidadeTotal, 12 / mesesInvestindo) - 1
        }
      }
    }

    // Preparar dados para o relatório
    const reportData: PortfolioReportData = {
      user: {
        name: user.name,
        email: user.email,
      },
      generatedAt: new Date(),
      metrics: {
        totalDeals,
        portfolioDeals: portfolioCount,
        pipelineCount,
        pipelineValue,
        portfolioValue,
        soldCount,
        rentingCount,
        totalRentIncome,
        rentabilidadeAnual,
        rentabilidadeTotal,
        mesesInvestindo,
      },
      deals: deals.map(deal => ({
        id: deal.id,
        propertyName: deal.propertyName,
        propertyType: deal.propertyType,
        address: deal.address,
        status: deal.status,
        purchasePrice: deal.purchasePrice,
        acquisitionCosts: deal.acquisitionCosts,
        roi: deal.roi,
        monthlyCashFlow: deal.monthlyCashFlow,
        monthlyRent: deal.monthlyRent,
        resalePrice: deal.resalePrice,
      })),
    }

    // Gerar PDF
    const pdfBuffer = await generateReport('portfolio', reportData)

    // Retornar PDF como resposta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-portfolio-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Erro ao gerar relatório de portfólio', error, undefined, 'PDF')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

