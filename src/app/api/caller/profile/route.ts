import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { callerSettingsSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const caller = await prisma.caller.findUnique({
      where: { id: callerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            emailVerified: true,
            accountStatus: true,
            createdAt: true,
          },
        },
      },
    })

    if (!caller) {
      return NextResponse.json({ error: 'Caller not found' }, { status: 404 })
    }

    return NextResponse.json({
      caller: {
        id: caller.id,
        displayName: caller.displayName,
        bio: caller.bio,
        location: caller.location,
        timezone: caller.timezone,
        phone: caller.phone,
        salesExperience: caller.salesExperience,
        proofOfResults: caller.proofOfResults,
        nicheExpertise: caller.nicheExpertise,
        stripeAccountId: caller.stripeAccountId,
        stripeOnboarded: caller.stripeOnboarded,
        payoutPreference: caller.payoutPreference,
        tier: caller.tier,
        totalLeadsWorked: caller.totalLeadsWorked,
        totalAppointments: caller.totalAppointments,
        conversionRate: caller.conversionRate,
        avgRating: caller.avgRating,
        totalEarnings: caller.totalEarnings,
        disputeRate: caller.disputeRate,
        disputeCount: caller.disputeCount,
        showUpRate: caller.showUpRate,
        acceptedTerms: caller.acceptedTerms,
        coolingPeriodEnds: caller.coolingPeriodEnds,
        createdAt: caller.createdAt,
        updatedAt: caller.updatedAt,
        user: caller.user,
      },
    })
  } catch (error) {
    console.error('Caller profile GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = callerSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const updatedCaller = await prisma.caller.update({
      where: { id: callerId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.salesExperience !== undefined && { salesExperience: data.salesExperience }),
        ...(data.nicheExpertise !== undefined && { nicheExpertise: data.nicheExpertise }),
        ...(data.payoutPreference !== undefined && { payoutPreference: data.payoutPreference }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      caller: {
        id: updatedCaller.id,
        displayName: updatedCaller.displayName,
        bio: updatedCaller.bio,
        location: updatedCaller.location,
        timezone: updatedCaller.timezone,
        phone: updatedCaller.phone,
        salesExperience: updatedCaller.salesExperience,
        nicheExpertise: updatedCaller.nicheExpertise,
        payoutPreference: updatedCaller.payoutPreference,
        tier: updatedCaller.tier,
        stripeOnboarded: updatedCaller.stripeOnboarded,
        updatedAt: updatedCaller.updatedAt,
        user: updatedCaller.user,
      },
    })
  } catch (error) {
    console.error('Caller profile PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
