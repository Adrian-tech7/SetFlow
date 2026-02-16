import { UserRole, Tier } from '@prisma/client'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  businessId: string | null
  callerId: string | null
}

export interface DashboardStats {
  totalLeads: number
  activeLeads: number
  totalAppointments: number
  verifiedAppointments: number
  totalEarnings: number
  pendingPayments: number
  avgRating: number
  successRate: number
}

export interface LeadWithAssignment {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  status: string
  assignedTo?: {
    id: string
    displayName: string
    tier: Tier
  }
}

export interface AppointmentWithDetails {
  id: string
  leadFirstName: string
  leadLastName: string
  scheduledAt: string
  status: string
  tier: Tier
  businessCharge: number
  callerPayout: number
  business: {
    companyName: string
  }
  caller: {
    displayName: string
  }
  payment?: {
    status: string
  }
}

export interface CallerProfile {
  id: string
  displayName: string
  bio: string | null
  specialties: string[]
  experienceYears: number
  tier: Tier
  totalAppointmentsSet: number
  successRate: number
  avgRating: number
  isVerified: boolean
}
