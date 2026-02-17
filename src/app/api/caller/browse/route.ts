import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const industry = searchParams.get('industry')

    const where: any = {
      leads: { some: { status: 'AVAILABLE' } },
      stripeOnboarded: true,
    }
    if (industry) where.industry = industry

    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        industry: true,
        description: true,
        avgRating: true,
        defaultPayoutAmount: true,
        _count: {
          select: {
            leads: { where: { status: 'AVAILABLE' } },
          },
        },
      },
      orderBy: { avgRating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      businesses: businesses.map((b) => ({
        id: b.id,
        companyName: b.companyName,
        industry: b.industry,
        description: b.description,
        avgRating: b.avgRating,
        defaultPayoutAmount: b.defaultPayoutAmount,
        availableLeads: b._count.leads,
      })),
    })
  } catch (error) {
    console.error('Browse leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
