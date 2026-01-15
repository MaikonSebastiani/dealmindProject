import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  // Segurança: nunca permitir em produção
  if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 })
  }

  const token = req.headers.get("x-reset-token") ?? ""
  const expected = process.env.RESET_DEALS_TOKEN ?? ""
  if (!expected || token !== expected) {
    return new Response("Unauthorized", { status: 401 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const result = await prisma.deal.deleteMany({
    where: { userId: session.user.id },
  })

  return Response.json({ deleted: result.count })
}


