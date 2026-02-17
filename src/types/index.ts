import { UserRole, Tier, AccountStatus } from '@prisma/client'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  businessId: string | null
  callerId: string | null
  accountStatus: AccountStatus
}

export interface DashboardStats {
  totalLeads: number
  activeLeads: number
  totalAppointments: number
  verifiedAppointments: number
  totalEarnings: number
  totalSpent: number
  pendingPayments: number
  avgRating: number
  conversionRate: number
  activeCallers: number
  activePools: number
  tier: Tier
  stripeOnboarded: boolean
}

export interface LeadPoolView {
  id: string
  name: string
  industry: string
  description: string | null
  payoutAmount: number
  status: string
  leadCount: number
  activeCallers: number
  maxCallers: number
  tags: string[]
  createdAt: string
  business: {
    id: string
    companyName: string
    avgRating: number
    bookingLink: string | null
  }
}

export interface CallerProfile {
  id: string
  userId: string
  displayName: string
  bio: string | null
  location: string | null
  timezone: string | null
  salesExperience: string | null
  nicheExpertise: string[]
  tier: Tier
  totalLeadsWorked: number
  totalAppointments: number
  conversionRate: number
  avgRating: number
  totalEarnings: number
  disputeRate: number
  showUpRate: number
  stripeOnboarded: boolean
}

export interface AppointmentView {
  id: string
  scheduledAt: string
  status: string
  callerTier: Tier
  payoutAmount: number
  platformFee: number
  totalCharge: number
  notes: string | null
  createdAt: string
  lead: {
    name: string
    company: string
    email: string
  }
  business: {
    id: string
    companyName: string
  }
  caller: {
    id: string
    displayName: string
    tier: Tier
  }
  payment?: {
    status: string
    paidAt: string | null
  }
  rating?: {
    score: number
    review: string | null
  }
}

export interface NotificationView {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  data: any
}

export interface LeaderboardEntry {
  callerId: string
  displayName: string
  tier: Tier
  totalAppointments: number
  conversionRate: number
  avgRating: number
  totalEarnings: number
}
