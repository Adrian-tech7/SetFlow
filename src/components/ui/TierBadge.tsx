import { TIER_CONFIG, type TierKey } from '@/lib/utils'

interface TierBadgeProps {
  tier: TierKey
  size?: 'sm' | 'md' | 'lg'
}

export default function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier]
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span className={`badge ${config.color} ${sizeClasses[size]} font-semibold`}>
      {config.label}
    </span>
  )
}
