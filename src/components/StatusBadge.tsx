type Status = 'online' | 'offline' | 'error' | 'active' | 'idle' | 'connecting' |
              'todo' | 'in_progress' | 'done' | 'backlog' | 'cancelled' |
              'filled' | 'pending' | 'canceled' | 'partially_filled' | 'new' |
              string

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  online:           { color: 'bg-green-400', label: 'Online' },
  active:           { color: 'bg-blue-400', label: 'Active' },
  idle:             { color: 'bg-gray-400', label: 'Idle' },
  offline:          { color: 'bg-gray-600', label: 'Offline' },
  error:            { color: 'bg-red-400', label: 'Error' },
  connecting:       { color: 'bg-yellow-400 animate-pulse', label: 'Connecting' },
  todo:             { color: 'bg-blue-400', label: 'Todo' },
  in_progress:      { color: 'bg-yellow-400', label: 'In Progress' },
  done:             { color: 'bg-green-400', label: 'Done' },
  backlog:          { color: 'bg-gray-500', label: 'Backlog' },
  cancelled:        { color: 'bg-gray-500', label: 'Cancelled' },
  filled:           { color: 'bg-green-400', label: 'Filled' },
  pending:          { color: 'bg-yellow-400', label: 'Pending' },
  canceled:         { color: 'bg-red-400', label: 'Canceled' },
  partially_filled: { color: 'bg-blue-400', label: 'Partial' },
  new:              { color: 'bg-gray-400', label: 'New' },
}

interface Props {
  status: Status
  label?: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, label, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status] ?? { color: 'bg-gray-500', label: status }
  const displayLabel = label ?? config.label
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} text-gray-400`}>
      <span className={`${dotSize} rounded-full ${config.color} inline-block shrink-0`} />
      {displayLabel}
    </span>
  )
}
