import { UserRole } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: UserRole
    businessId: string | null
    callerId: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      businessId: string | null
      callerId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    businessId: string | null
    callerId: string | null
  }
}
