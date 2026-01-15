import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

function safeFileName(name: string) {
  return name.replace(/[/\\"]/g, "_")
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; doc: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id, doc } = await params

  const deal = await prisma.deal.findFirst({
    where: { id, userId: session.user.id },
  }) as {
    propertyRegistryFileName?: string | null
    propertyRegistryData?: Uint8Array | null
    auctionNoticeFileName?: string | null
    auctionNoticeData?: Uint8Array | null
  } | null

  if (!deal) {
    return new Response("Not Found", { status: 404 })
  }

  const isRegistry = doc === "property-registry"
  const isAuction = doc === "auction-notice"
  if (!isRegistry && !isAuction) {
    return new Response("Not Found", { status: 404 })
  }

  const fileName = isRegistry ? deal.propertyRegistryFileName : deal.auctionNoticeFileName
  const data = isRegistry ? deal.propertyRegistryData : deal.auctionNoticeData

  if (!data) {
    return new Response("Not Found", { status: 404 })
  }

  const name = safeFileName(fileName ?? (isRegistry ? "matricula.pdf" : "edital.pdf"))
  
  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
