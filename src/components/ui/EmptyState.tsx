interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-surface-900 mb-2">{title}</h3>
      <p className="text-surface-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        action.href ? (
          <a href={action.href} className="btn-primary inline-block">{action.label}</a>
        ) : (
          <button onClick={action.onClick} className="btn-primary">{action.label}</button>
        )
      )}
    </div>
  )
}
