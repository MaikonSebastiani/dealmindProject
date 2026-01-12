import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { calculateDealMetrics } from '@/lib/domain/finance/calculateDealMetrics'
import { auth } from '@/auth'

const DealSchema = z.object({
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
    const input = DealSchema.parse(body)

    const metrics = calculateDealMetrics(input)

    const deal = await prisma.deal.create({
      data: {
        userId: session.user.id,

        purchasePrice: input.purchasePrice,
        acquisitionCosts: input.acquisitionCosts,
        monthlyRent: input.monthlyRent,
        monthlyExpenses: input.monthlyExpenses,
        annualPropertyTax: input.annualPropertyTax,

        downPayment: input.financing?.downPayment,
        monthlyInstallment: input.financing?.monthlyInstallment,

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
