import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { markAlertAsRead } from "@/lib/dashboard/markAlertAsRead"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { alertId } = await req.json()

    if (!alertId || typeof alertId !== "string") {
      return NextResponse.json({ error: "alertId is required" }, { status: 400 })
    }

    await markAlertAsRead(session.user.id, alertId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao marcar alerta como lido:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

