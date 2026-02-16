'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const businessLinks = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/leads', label: 'My Leads', icon: '📋' },
  { href: '/dashboard/access-requests', label: 'Access Requests', icon: '🔑' },
  { href: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

const callerLinks = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/browse', label: 'Browse Leads', icon: '🔍' },
  { href: '/dashboard/my-leads', label: 'My Assignments', icon: '📋' },
  { href: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { href: '/dashboard/earnings', label: 'Earnings', icon: '💰' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const links = role === 'CALLER' ? callerLinks : businessLinks

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-surface-950 border-r border-surface-800 flex flex-col">
      <div className="p-6 border-b border-surface-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="text-white font-bold text-lg">SetFlow</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-surface-400 hover:bg-surface-900 hover:text-white'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-surface-800">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-8 h-8 bg-surface-700 rounded-full flex items-center justify-center text-xs text-white font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-surface-500 text-xs truncate">{role === 'CALLER' ? 'Caller' : 'Business'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-4 py-2.5 text-sm text-surface-400 hover:text-white hover:bg-surface-900 rounded-xl transition-all text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
