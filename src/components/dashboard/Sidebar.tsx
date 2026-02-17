'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Upload, Users, Calendar, CreditCard, Settings,
  Search, FolderOpen, DollarSign, Trophy, Shield, AlertTriangle, BarChart3
} from 'lucide-react'

const businessLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/lead-pools', label: 'Lead Pools', icon: FolderOpen },
  { href: '/dashboard/upload', label: 'Upload Leads', icon: Upload },
  { href: '/dashboard/callers', label: 'Callers', icon: Users },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const callerLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/browse', label: 'Browse Leads', icon: Search },
  { href: '/dashboard/my-leads', label: 'My Leads', icon: FolderOpen },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const adminLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/disputes', label: 'Disputes', icon: Shield },
  { href: '/dashboard/admin/fraud', label: 'Fraud Alerts', icon: AlertTriangle },
  { href: '/dashboard/admin/stats', label: 'Platform Stats', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const links = role === 'ADMIN' ? adminLinks : role === 'CALLER' ? callerLinks : businessLinks
  const roleLabel = role === 'ADMIN' ? 'Admin' : role === 'CALLER' ? 'Caller' : 'Business'

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-surface-950 border-r border-surface-800 flex flex-col z-50">
      <div className="p-6 border-b border-surface-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CF</span>
          </div>
          <span className="text-white font-bold text-lg">CloseFlow</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-surface-400 hover:bg-surface-900 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-surface-800">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 bg-surface-700 rounded-full flex items-center justify-center text-xs text-white font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-surface-500 text-xs">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-4 py-2 text-sm text-surface-400 hover:text-white hover:bg-surface-900 rounded-lg transition-all text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
