import { usePoll } from '../hooks/usePoll'

interface Activity {
  agent: string
  action: string
  identifier: string
  status: string
  timestamp: string
}

const AGENT_COLORS: Record<string, { text: string; dot: string }> = {
  'Engineer':          { text: 'text-blue-400',   dot: 'bg-blue-400' },
  'Portfolio Manager': { text: 'text-green-400',  dot: 'bg-green-400' },
  'Researcher':        { text: 'text-purple-400', dot: 'bg-purple-400' },
  'CTO':               { text: 'text-yellow-400', dot: 'bg-yellow-400' },
}

const STATUS_DOT: Record<string, string> = {
  done:        'bg-green-400',
  in_progress: 'bg-blue-400 animate-pulse',
  todo:        'bg-gray-600',
}

function relativeTime(ts: string): string {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ActivityFeed() {
  const { data, loading } = usePoll<Activity[]>('/api/activity', 30_000)
  const activities = data ?? []

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Agent Activity</span>
        <div className="flex items-center gap-3">
          {!loading && <span className="text-xs text-gray-600">{activities.length} events</span>}
          <a
            href="/feed"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            full feed ↗
          </a>
        </div>
      </div>
      <div className="divide-y divide-gray-800/50">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-3 py-2">
              <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4 mb-1" />
              <div className="h-2 bg-gray-800 rounded animate-pulse w-1/2" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-gray-600">No recent activity</div>
        ) : (
          activities.map((a) => {
            const colors = AGENT_COLORS[a.agent] ?? { text: 'text-gray-400', dot: 'bg-gray-500' }
            const statusDot = STATUS_DOT[a.status] ?? STATUS_DOT.todo
            return (
              <div key={a.identifier || a.action} className="px-3 py-2 hover:bg-gray-800/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                  <span className={`text-xs font-medium ${colors.text}`}>{a.agent}</span>
                  {a.identifier && (
                    <span className="text-xs text-gray-700 font-mono">{a.identifier}</span>
                  )}
                  <span className="text-xs text-gray-600 ml-auto shrink-0">{relativeTime(a.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-400 leading-tight pl-3">{a.action}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
