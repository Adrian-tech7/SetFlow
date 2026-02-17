import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import {
  registerBusinessSchema,
  registerCallerSchema,
} from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { role } = body

    if (!role || !['BUSINESS', 'CALLER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be BUSINESS or CALLER.' },
        { status: 400 }
      )
    }

    // Validate based on role
    const data =
      role === 'BUSINESS'
        ? registerBusinessSchema.parse(body)
        : registerCallerSchema.parse(body)

    const email = data.email.toLowerCase()

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    if (role === 'BUSINESS') {
      const bizData = data as typeof registerBusinessSchema._output
      const emailDomain = email.split('@')[1]

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name: bizData.name,
            role: 'BUSINESS',
            business: {
              create: {
                companyName: bizData.companyName,
                industry: bizData.industry as any,
                emailDomain,
                bookingLink: bizData.bookingLink,
                defaultPayoutAmount: bizData.defaultPayoutAmount,
              },
            },
          },
          include: { business: true },
        })
        return newUser
      })

      return NextResponse.json(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.business?.id,
        },
        { status: 201 }
      )
    }

    // CALLER registration
    const callerData = data as typeof registerCallerSchema._output

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: callerData.name,
          role: 'CALLER',
          caller: {
            create: {
              displayName: callerData.displayName,
              bio: callerData.bio || null,
              location: callerData.location || null,
              timezone: callerData.timezone || null,
              salesExperience: callerData.salesExperience || null,
              nicheExpertise: callerData.nicheExpertise || [],
              acceptedTerms: callerData.acceptedTerms,
              coolingPeriodEnds: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
        },
        include: { caller: true },
      })
      return newUser
    })

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        callerId: user.caller?.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
