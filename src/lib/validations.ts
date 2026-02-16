import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['BUSINESS', 'CALLER']),
  // Business fields
  companyName: z.string().optional(),
  industry: z.string().optional(),
  // Caller fields
  displayName: z.string().optional(),
  bio: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const leadUploadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const appointmentSchema = z.object({
  leadFirstName: z.string().min(1),
  leadLastName: z.string().min(1),
  leadEmail: z.string().email().optional(),
  leadPhone: z.string().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
})

export const ratingSchema = z.object({
  appointmentId: z.string().min(1),
  score: z.number().min(1).max(5),
  review: z.string().optional(),
})

export const disputeSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().min(1),
  description: z.string().min(10),
})
