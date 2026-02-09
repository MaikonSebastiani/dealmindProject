import { PrismaClient } from "@prisma/client"

/**
 * Calcula o tempo médio de venda (em dias) entre "À venda" e "Vendido"
 */
export async function calculateAverageSaleTime(
  userId: string,
  prisma: PrismaClient
): Promise<{ averageDays: number | null; averageMonths: number | null; totalSales: number }> {
  // Buscar todas as mudanças para "Vendido"
  const sales = await prisma.dealStatusChange.findMany({
    where: {
      deal: { userId },
      toStatus: "Vendido",
    },
    orderBy: { changedAt: "asc" },
    include: {
      deal: {
        select: {
          id: true,
        },
      },
    },
  })

  if (sales.length === 0) {
    return { averageDays: null, averageMonths: null, totalSales: 0 }
  }

  // Para cada venda, buscar quando foi para "À venda"
  const saleTimes: number[] = []

  for (const sale of sales) {
    // Buscar mudança para "À venda" do mesmo deal
    const forSaleChange = await prisma.dealStatusChange.findFirst({
      where: {
        dealId: sale.dealId,
        toStatus: "À venda",
      },
      orderBy: { changedAt: "asc" },
    })

    if (forSaleChange) {
      // Calcular diferença em dias
      const daysDiff = Math.floor(
        (sale.changedAt.getTime() - forSaleChange.changedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysDiff > 0) {
        saleTimes.push(daysDiff)
      }
    }
  }

  if (saleTimes.length === 0) {
    return { averageDays: null, averageMonths: null, totalSales: sales.length }
  }

  const totalDays = saleTimes.reduce((acc, days) => acc + days, 0)
  const averageDays = Math.round(totalDays / saleTimes.length)
  const averageMonths = Math.round((averageDays / 30) * 10) / 10 // Arredondar para 1 casa decimal

  return {
    averageDays,
    averageMonths,
    totalSales: saleTimes.length,
  }
}

