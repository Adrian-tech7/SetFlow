const statusStyles: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-indigo-100 text-indigo-800',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
  NOT_INTERESTED: 'bg-surface-100 text-surface-600',
  CONVERTED: 'bg-accent-100 text-accent-800',
  EXPIRED: 'bg-surface-100 text-surface-600',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-orange-100 text-orange-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-surface-100 text-surface-600',
  VALID: 'bg-green-100 text-green-800',
  INVALID: 'bg-red-100 text-red-800',
  RESOLVED: 'bg-surface-100 text-surface-600',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  FROZEN: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REVOKED: 'bg-red-100 text-red-800',
  PAYMENT_ISSUE: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: { status: string }) {
  const formatted = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  return (
    <span className={`badge ${statusStyles[status] || 'bg-surface-100 text-surface-600'}`}>
      {formatted}
    </span>
  )
}
