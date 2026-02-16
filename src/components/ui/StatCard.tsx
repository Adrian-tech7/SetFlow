interface StatCardProps {
  label: string
  value: string | number
  icon: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export default function StatCard({ label, value, icon, change, changeType = 'neutral' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-surface-500 text-sm font-medium">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-surface-900">{value}</div>
      {change && (
        <p className={`text-sm mt-1 ${
          changeType === 'positive' ? 'text-green-600' :
          changeType === 'negative' ? 'text-red-500' : 'text-surface-500'
        }`}>
          {change}
        </p>
      )}
    </div>
  )
}
