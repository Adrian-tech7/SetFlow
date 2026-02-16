const statusStyles: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  APPOINTMENT_SET: 'bg-purple-100 text-purple-800',
  EXPIRED: 'bg-surface-100 text-surface-600',
  RETURNED: 'bg-red-100 text-red-800',
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
  OPEN: 'bg-red-100 text-red-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  RESOLVED_BUSINESS: 'bg-green-100 text-green-800',
  RESOLVED_CALLER: 'bg-green-100 text-green-800',
  CLOSED: 'bg-surface-100 text-surface-600',
  ACTIVE: 'bg-green-100 text-green-800',
}

export default function StatusBadge({ status }: { status: string }) {
  const formatted = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  return (
    <span className={`badge ${statusStyles[status] || 'bg-surface-100 text-surface-600'}`}>
      {formatted}
    </span>
  )
}
