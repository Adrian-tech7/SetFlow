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

export const TIER_CONFIG = {
  BASIC: {
    label: 'Basic',
    businessCharge: 75,
    callerPayout: 50,
    platformFee: 25,
    color: 'bg-surface-300 text-surface-800',
    badge: '🟢',
  },
  ADVANCED: {
    label: 'Advanced',
    businessCharge: 100,
    callerPayout: 75,
    platformFee: 25,
    color: 'bg-primary-100 text-primary-800',
    badge: '🔵',
  },
  ELITE: {
    label: 'Elite',
    businessCharge: 125,
    callerPayout: 100,
    platformFee: 25,
    color: 'bg-accent-100 text-accent-800',
    badge: '⚡',
  },
} as const

export type TierKey = keyof typeof TIER_CONFIG
