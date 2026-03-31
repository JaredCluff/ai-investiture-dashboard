import { usePoll } from '../hooks/usePoll'

interface Activity {
  agent: string
  action: string
  identifier: string
  status: string
  timestamp: string
}

const AGENT_COLORS: Record<string, string> = {
  'Engineer': 'text-blue-400',
  'Portfolio Manager': 'text-green-400',
  'Researcher': 'text-purple-400',
  'CTO': 'text-yellow-400',
  'System': 'text-gray-400',
}

export default function ActivityFeed() {
  const { data, loading } = usePoll<Activity[]>('/api/activity', 30_000)
  const activities = data ?? []

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Agent Activity</span>
        {!loading && <span className="text-xs text-gray-600">{activities.length} events</span>}
      </div>
      <div className="divide-y divide-gray-800/50">
        {loading ? (
          Array.from({length: 5}).map((_, i) => (
            <div key={i} className="px-3 py-2">
              <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4 mb-1" />
              <div className="h-2 bg-gray-800 rounded animate-pulse w-1/2" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-gray-600">No recent activity</div>
        ) : (
          activities.map((a, i) => (
            <div key={i} className="px-3 py-2 hover:bg-gray-800/20">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-xs font-medium ${AGENT_COLORS[a.agent] ?? 'text-gray-400'}`}>
                  {a.agent}
                </span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-gray-600">
                  {a.timestamp ? new Date(a.timestamp).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-tight">{a.action}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
