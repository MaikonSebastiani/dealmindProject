import { prisma } from "@/lib/db/prisma"

/**
 * Marca um alerta como lido pelo usuário
 */
export async function markAlertAsRead(userId: string, alertId: string) {
  try {
    await prisma.readAlert.upsert({
      where: {
        userId_alertId: {
          userId,
          alertId,
        },
      },
      create: {
        userId,
        alertId,
      },
      update: {
        readAt: new Date(),
      },
    })
  } catch (error) {
    // Ignorar erros silenciosamente (não é crítico)
    console.error("Erro ao marcar alerta como lido:", error)
  }
}

