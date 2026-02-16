import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ratingSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    const body = await req.json()
    const data = ratingSchema.parse(body)

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: data.appointmentId,
        businessId,
        status: { in: ['VERIFIED', 'COMPLETED'] },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found or not eligible' }, { status: 404 })
    }

    const existing = await prisma.rating.findUnique({
      where: { appointmentId: data.appointmentId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already rated' }, { status: 409 })
    }

    const rating = await prisma.rating.create({
      data: {
        appointmentId: data.appointmentId,
        businessId,
        callerId: appointment.callerId,
        score: data.score,
        review: data.review,
      },
    })

    // Update caller avg rating
    const avgResult = await prisma.rating.aggregate({
      where: { callerId: appointment.callerId },
      _avg: { score: true },
    })

    await prisma.caller.update({
      where: { id: appointment.callerId },
      data: { avgRating: avgResult._avg.score || 0 },
    })

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }
    console.error('Rating error:', error)
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
  }
}
