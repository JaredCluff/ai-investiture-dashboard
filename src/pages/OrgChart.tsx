import { useNavigate } from 'react-router-dom'
import { usePoll } from '../hooks/usePoll'
import StatusBadge from '../components/StatusBadge'

interface Agent {
  id: string
  name: string
  role?: string
  status?: string
  assignedTickets?: number
}

interface OrgResponse {
  company: { name: string; description: string | null }
  agents: Agent[]
}

const ROLE_ACCENT: Record<string, { border: string; badge: string; initials: string }> = {
  ceo:                { border: 'border-yellow-800/40', badge: 'bg-yellow-900/40 text-yellow-400', initials: 'CE' },
  cto:                { border: 'border-blue-800/40', badge: 'bg-blue-900/40 text-blue-400', initials: 'CT' },
  engineer:           { border: 'border-green-800/40', badge: 'bg-green-900/40 text-green-400', initials: 'EN' },
  researcher:         { border: 'border-purple-800/40', badge: 'bg-purple-900/40 text-purple-400', initials: 'RE' },
  'portfolio-manager':{ border: 'border-cyan-800/40', badge: 'bg-cyan-900/40 text-cyan-400', initials: 'PM' },
  qa:                 { border: 'border-orange-800/40', badge: 'bg-orange-900/40 text-orange-400', initials: 'QA' },
  legal:              { border: 'border-red-800/40', badge: 'bg-red-900/40 text-red-400', initials: 'LG' },
  marketing:          { border: 'border-pink-800/40', badge: 'bg-pink-900/40 text-pink-400', initials: 'MK' },
}

function getRoleAccent(role?: string) {
  const key = (role ?? '').toLowerCase().replace(/\s+/g, '-')
  return ROLE_ACCENT[key] ?? { border: 'border-gray-800', badge: 'bg-gray-800 text-gray-400', initials: '??' }
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-gray-800 animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-28 bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
    </div>
  )
}

export default function OrgChart() {
  const { data, loading, error, lastUpdated } = usePoll<OrgResponse>('/api/org', 120_000)
  const navigate = useNavigate()

  const agents = data?.agents ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Org Chart</h1>
          <p className="text-sm text-gray-500 mt-1">AI agents running this portfolio</p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-600">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Unable to load org data: {error}. Retrying every 120s.
        </div>
      )}

      {/* Company info card */}
      {!loading && data?.company && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-base font-semibold text-gray-100">{data.company.name}</h2>
          {data.company.description && (
            <p className="text-sm text-gray-400 mt-1">{data.company.description}</p>
          )}
        </div>
      )}

      {/* Agent grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-12 text-center">
          <p className="text-sm text-gray-500">No agents found</p>
          <p className="text-xs text-gray-600 mt-1">Agent data will appear here once configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const accent = getRoleAccent(agent.role)
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/tickets?assignee=${encodeURIComponent(agent.name)}`)}
                className={`bg-gray-900 border ${accent.border} rounded-lg p-4 cursor-pointer hover:bg-gray-800/50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-md ${accent.badge} flex items-center justify-center text-xs font-bold shrink-0`}>
                    {accent.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-100 truncate">{agent.name}</p>
                    {agent.role && (
                      <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {agent.status && (
                    <StatusBadge status={agent.status} size="sm" />
                  )}
                  {agent.assignedTickets != null && (
                    <span className="text-xs text-gray-500">
                      {agent.assignedTickets} ticket{agent.assignedTickets !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
