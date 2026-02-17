import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')
    const poolId = searchParams.get('poolId')

    // Get all caller IDs with approved access to this business
    const accessRequestWhere: any = {
      businessId,
      status: 'APPROVED',
    }
    if (poolId) accessRequestWhere.leadPoolId = poolId

    const approvedRequests = await prisma.accessRequest.findMany({
      where: accessRequestWhere,
      select: { callerId: true, leadPoolId: true },
    })

    const callerIds = [...new Set(approvedRequests.map((ar) => ar.callerId))]

    if (callerIds.length === 0) {
      return NextResponse.json({ callers: [] })
    }

    // Build caller filter
    const callerWhere: any = { id: { in: callerIds } }
    if (tier) callerWhere.tier = tier
    if (search) {
      callerWhere.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ]
    }

    const callers = await prisma.caller.findMany({
      where: callerWhere,
      select: {
        id: true,
        displayName: true,
        bio: true,
        tier: true,
        conversionRate: true,
        avgRating: true,
        totalAppointments: true,
        totalLeadsWorked: true,
        nicheExpertise: true,
      },
    })

    // Get private CallerNotes for this business
    const callerNotes = await prisma.callerNote.findMany({
      where: {
        businessId,
        callerId: { in: callerIds },
      },
    })
    const notesMap = new Map(callerNotes.map((cn) => [cn.callerId, cn.note]))

    const callersWithNotes = callers.map((caller) => ({
      ...caller,
      privateNote: notesMap.get(caller.id) || null,
    }))

    return NextResponse.json({ callers: callersWithNotes })
  } catch (error) {
    console.error('Callers list error:', error)
    return NextResponse.json({ error: 'Failed to fetch callers' }, { status: 500 })
  }
}
