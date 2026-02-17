import { z } from 'zod'

export const registerBusinessSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  bookingLink: z.string().url('Must be a valid URL').min(1, 'Calendar link is required'),
  defaultPayoutAmount: z.number().min(25, 'Minimum payout is $25').max(500, 'Maximum payout is $500'),
})

export const registerCallerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name is required'),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  salesExperience: z.string().optional(),
  nicheExpertise: z.array(z.string()).optional(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the independent contractor agreement' }) }),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const leadUploadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  company: z.string().min(1, 'Company is required'),
  industry: z.string().optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const leadPoolSchema = z.object({
  name: z.string().min(1, 'Pool name is required'),
  industry: z.string().optional(),
  description: z.string().optional(),
  payoutAmount: z.number().min(25, 'Minimum payout is $25').max(500, 'Maximum is $500'),
  maxCallers: z.number().min(1).max(50).optional(),
  expiresAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const accessRequestSchema = z.object({
  leadPoolId: z.string().min(1),
  message: z.string().optional(),
})

export const ratingSchema = z.object({
  appointmentId: z.string().min(1),
  score: z.number().min(1).max(5),
  review: z.string().optional(),
})

export const disputeSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().min(10, 'Provide at least 10 characters of detail'),
  evidence: z.string().optional(),
})

export const updateLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(['CONTACTED', 'FOLLOW_UP', 'NOT_INTERESTED']),
  notes: z.string().optional(),
})

export const businessSettingsSchema = z.object({
  companyName: z.string().min(2).optional(),
  description: z.string().optional(),
  bookingLink: z.string().url('Must be a valid URL').optional(),
  bookingWebhookUrl: z.string().url().optional().or(z.literal('')),
  defaultPayoutAmount: z.number().min(25).max(500).optional(),
  maxCallersPerPool: z.number().min(1).max(50).optional(),
  verificationWindow: z.number().min(1).max(168).optional(),
})

export const callerSettingsSchema = z.object({
  displayName: z.string().min(2).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  salesExperience: z.string().optional(),
  nicheExpertise: z.array(z.string()).optional(),
  payoutPreference: z.enum(['instant', 'weekly']).optional(),
})
