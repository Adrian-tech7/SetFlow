import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function getTimeRemaining(deadline: Date | string): string {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  return `${hours}h ${minutes}m`
}

export const PLATFORM_FEE = 25

export const TIER_CONFIG = {
  BASIC: {
    label: 'Basic',
    callerPayout: 50,
    color: 'bg-surface-200 text-surface-700',
    borderColor: 'border-surface-300',
    textColor: 'text-surface-600',
    requirements: {
      leadsWorked: 0,
      conversionRate: 0,
      avgRating: 0,
      maxDisputeRate: 1,
    },
  },
  ADVANCED: {
    label: 'Advanced',
    callerPayout: 75,
    color: 'bg-primary-100 text-primary-700',
    borderColor: 'border-primary-300',
    textColor: 'text-primary-600',
    requirements: {
      leadsWorked: 100,
      conversionRate: 0.05,
      avgRating: 4.0,
      maxDisputeRate: 0.05,
    },
  },
  ELITE: {
    label: 'Elite',
    callerPayout: 100,
    color: 'bg-accent-100 text-accent-700',
    borderColor: 'border-accent-300',
    textColor: 'text-accent-600',
    requirements: {
      leadsWorked: 500,
      conversionRate: 0.08,
      avgRating: 4.5,
      maxDisputeRate: 0.03,
    },
  },
} as const

export type TierKey = keyof typeof TIER_CONFIG

export const INDUSTRY_LABELS: Record<string, string> = {
  AI_SERVICES: 'AI Services',
  SAAS: 'SaaS',
  WEB_DESIGN: 'Web Design',
  DIGITAL_MARKETING: 'Digital Marketing',
  SOFTWARE_DEV: 'Software Development',
  CONSULTING: 'Consulting',
  AUTOMATION: 'Automation',
  DATA_ANALYTICS: 'Data & Analytics',
  CYBERSECURITY: 'Cybersecurity',
  CLOUD_SERVICES: 'Cloud Services',
  OTHER: 'Other',
}

export const DISPUTE_REASONS = [
  'Wrong lead - appointment not with uploaded contact',
  'Fake appointment - no real booking exists',
  'Double-booked - duplicate appointment',
  'No-show - prospect did not attend',
]

export function calculateTier(stats: {
  totalLeadsWorked: number
  conversionRate: number
  avgRating: number
  disputeRate: number
}): TierKey {
  const elite = TIER_CONFIG.ELITE.requirements
  const advanced = TIER_CONFIG.ADVANCED.requirements

  if (
    stats.totalLeadsWorked >= elite.leadsWorked &&
    stats.conversionRate >= elite.conversionRate &&
    stats.avgRating >= elite.avgRating &&
    stats.disputeRate <= elite.maxDisputeRate
  ) {
    return 'ELITE'
  }

  if (
    stats.totalLeadsWorked >= advanced.leadsWorked &&
    stats.conversionRate >= advanced.conversionRate &&
    stats.avgRating >= advanced.avgRating &&
    stats.disputeRate <= advanced.maxDisputeRate
  ) {
    return 'ADVANCED'
  }

  return 'BASIC'
}

export function getCallerPayout(tier: TierKey): number {
  return TIER_CONFIG[tier].callerPayout
}

export function getTotalCharge(payoutAmount: number): number {
  return payoutAmount + PLATFORM_FEE
}
