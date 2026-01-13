import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { calculateDealMetrics } from '@/lib/domain/finance/calculateDealMetrics'
import { calculateProjectViability } from '@/lib/domain/finance/calculateProjectViability'
import { projectInputApiSchema, toProjectInputFromApi } from '@/lib/domain/deals/projectInput.schema'
import { auth } from '@/auth'

const LegacyDealSchema = z.object({
  propertyName: z.string().min(1).optional(),
  propertyType: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  purchasePrice: z.number().positive(),
  acquisitionCosts: z.number().min(0),
  monthlyRent: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  annualPropertyTax: z.number().min(0),
  financing: z
    .object({
      downPayment: z.number().positive(),
      monthlyInstallment: z.number().min(0),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const parsed = z.union([LegacyDealSchema, projectInputApiSchema]).parse(body)

    if ("monthlyRent" in parsed) {
      const metrics = calculateDealMetrics(parsed)

      const deal = await prisma.deal.create({
        data: {
          userId: session.user.id,

          propertyName: parsed.propertyName,
          propertyType: parsed.propertyType,
          address: parsed.address,

          purchasePrice: parsed.purchasePrice,
          acquisitionCosts: parsed.acquisitionCosts,
          monthlyRent: parsed.monthlyRent,
          monthlyExpenses: parsed.monthlyExpenses,
          annualPropertyTax: parsed.annualPropertyTax,

          downPayment: parsed.financing?.downPayment,
          monthlyInstallment: parsed.financing?.monthlyInstallment,

          monthlyCashFlow: metrics.monthlyCashFlow,
          annualCashFlow: metrics.annualCashFlow,
          roi: metrics.roi,
          capRate: metrics.capRate,
          paybackYears: metrics.paybackYears,

          riskNegativeCashFlow: metrics.risk.negativeCashFlow,
          riskLowROI: metrics.risk.lowROI,
          riskHighLeverage: metrics.risk.highLeverage,
        },
      })

      return NextResponse.json(deal)
    }

    const project = toProjectInputFromApi(parsed)
    const viability = calculateProjectViability(project)

    const deal = await prisma.deal.create({
      data: {
        userId: session.user.id,
        status: "Em análise",

        purchasePrice: project.acquisition.purchasePrice,
        acquisitionCosts: viability.acquisitionCosts,
        monthlyRent: 0,
        monthlyExpenses: 0,
        annualPropertyTax: 0,

        downPaymentPercent: project.acquisition.downPaymentPercent,
        auctioneerFeePercent: project.acquisition.auctioneerFeePercent ?? null,
        itbiPercent: project.acquisition.itbiPercent,
        registryCost: project.acquisition.registryCost,

        financingEnabled: Boolean(project.financing?.enabled),
        interestRateAnnual: project.financing?.interestRateAnnual ?? null,
        termMonths: project.financing?.termMonths ?? null,
        amortizationType: project.financing?.amortizationType ?? null,

        iptuDebt: project.liabilities.iptuDebt,
        condoDebt: project.liabilities.condoDebt,

        resalePrice: project.operationAndExit.resalePrice,
        resaleDiscountPercent: project.operationAndExit.resaleDiscountPercent,
        brokerFeePercent: project.operationAndExit.brokerFeePercent,
        monthlyCondoFee: project.operationAndExit.monthlyCondoFee,
        monthlyIptu: project.operationAndExit.monthlyIptu,
        expectedSaleMonths: project.operationAndExit.expectedSaleMonths,

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

    return NextResponse.json(deal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
