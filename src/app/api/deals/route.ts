import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)

  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = Number(searchParams.get('pageSize') ?? 10)
  const orderBy = searchParams.get('orderBy') ?? 'createdAt'
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

  const skip = (page - 1) * pageSize
  const take = pageSize

  try {
    const [items, total] = await Promise.all([
      prisma.deal.findMany({
        where: {
          userId: session.user.id,
        },
        skip,
        take,
        orderBy: {
          [orderBy]: order,
        },
      }),
      prisma.deal.count({
        where: {
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
