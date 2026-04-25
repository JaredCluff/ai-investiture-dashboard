import { usePoll } from '../hooks/usePoll'

interface ServiceCheck {
  name: string
  status: string
  http_code?: number
  error?: string
  last_run?: string
  age_hours?: number
  reason?: string
}

interface AgentEntry {
  role: string
  status: string
  adapter?: string
  freshness: string
  age_hours: number | null
  last_heartbeat: string | null
}

interface AgentHeartbeats {
  status: string
  error?: string
  agents: AgentEntry[]
}

interface TradeHalt {
  halted: boolean
  halted_at?: string
  reason?: string
  halted_by?: string
}

interface StatusResponse {
  status: string
  connected: boolean
  checked_at: string
  services: Record<string, ServiceCheck>
  agent_heartbeats: AgentHeartbeats
  trade_halt?: TradeHalt
}

const SERVICE_LABELS: Record<string, string> = {
  backend: 'Backend API',
  pr_agent: 'Spark (PR Agent)',
  nginx: 'nginx / Dashboard',
  nats: 'NATS Messaging',
  alpaca: 'Alpaca Markets',
  cron_supervisor: 'Cron Supervisor',
}

const SERVICE_ORDER = ['backend', 'pr_agent', 'nginx', 'nats', 'alpaca', 'cron_supervisor']

function statusColor(status: string) {
  switch (status) {
    case 'ok':
    case 'fresh':
      return 'bg-green-500'
    case 'stale':
    case 'degraded':
      return 'bg-yellow-500'
    case 'down':
    case 'dead':
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-600'
  }
}

function statusText(status: string) {
  switch (status) {
    case 'ok': return 'Healthy'
    case 'fresh': return 'Fresh'
    case 'stale': return 'Stale'
    case 'degraded': return 'Degraded'
    case 'down': return 'Down'
    case 'dead': return 'Dead'
    case 'error': return 'Error'
    case 'unknown': return 'Unknown'
    default: return status
  }
}

function freshnessColor(freshness: string) {
  switch (freshness) {
    case 'fresh': return 'text-green-400'
    case 'stale': return 'text-yellow-400'
    case 'dead': return 'text-red-400'
    default: return 'text-gray-500'
  }
}

function ServiceCard({ svc }: { svc: ServiceCheck }) {
  const label = SERVICE_LABELS[svc.name] ?? svc.name
  const dot = statusColor(svc.status)
  const text = statusText(svc.status)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-start gap-3">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className={`text-xs mt-0.5 ${svc.status === 'ok' ? 'text-green-400' : svc.status === 'stale' ? 'text-yellow-400' : svc.status === 'down' || svc.status === 'error' ? 'text-red-400' : 'text-gray-500'}`}>
          {text}
          {svc.http_code != null && ` · HTTP ${svc.http_code}`}
          {svc.age_hours != null && ` · ${svc.age_hours}h ago`}
        </p>
        {svc.error && (
          <p className="text-xs text-gray-600 mt-0.5 truncate">{svc.error}</p>
        )}
        {svc.reason && (
          <p className="text-xs text-gray-600 mt-0.5">{svc.reason}</p>
        )}
        {svc.last_run && (
          <p className="text-xs text-gray-600 mt-0.5">{new Date(svc.last_run).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}

export default function SystemStatus() {
  const { data, loading, error, lastUpdated } = usePoll<StatusResponse>('/api/status', 30_000)

  const overall = data?.status ?? (error ? 'down' : 'unknown')
  const overallDot = statusColor(overall)
  const overallLabel = overall === 'ok' ? 'All systems operational' : overall === 'degraded' ? 'Degraded' : 'Unknown'

  const services = data?.services
  const agents = data?.agent_heartbeats?.agents ?? []
  const halt = data?.trade_halt

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">System Status</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time health of all AI-Investiture services</p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-600">Updated {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {/* Overall status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        overall === 'ok'
          ? 'bg-green-950/30 border-green-800/40'
          : overall === 'degraded'
          ? 'bg-yellow-950/30 border-yellow-800/40'
          : 'bg-gray-900 border-gray-800'
      }`}>
        <span className={`w-3 h-3 rounded-full shrink-0 ${overallDot}`} />
        <span className="text-sm font-medium text-gray-200">
          {loading ? 'Checking…' : overallLabel}
        </span>
        {data?.checked_at && (
          <span className="text-xs text-gray-600 ml-auto">
            {new Date(data.checked_at).toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Unable to reach status endpoint: {error}
        </div>
      )}

      {/* Trade kill-switch banner */}
      {halt?.halted && (
        <div className="bg-red-950/40 border border-red-700/60 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="w-3 h-3 mt-0.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-red-300">Trading Halted</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              {halt.reason ?? 'Kill-switch active'}
              {halt.halted_at && ` — since ${new Date(halt.halted_at).toLocaleString()}`}
            </p>
          </div>
        </div>
      )}

      {/* Service grid */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Services</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_ORDER.map((key) => (
              <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 h-16 animate-pulse" />
            ))}
          </div>
        ) : services ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_ORDER.map((key) => {
              const svc = services[key]
              if (!svc) return null
              return <ServiceCard key={key} svc={svc} />
            })}
          </div>
        ) : null}
      </div>

      {/* Agent heartbeats */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Agent Heartbeats</h2>
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg h-32 animate-pulse" />
        ) : data?.agent_heartbeats?.status === 'error' || data?.agent_heartbeats?.status === 'down' ? (
          <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
            Could not load agent heartbeats: {data.agent_heartbeats.error}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
            No agents found
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="text-left px-4 py-2 hidden sm:table-cell">Adapter</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Freshness</th>
                  <th className="text-right px-4 py-2 hidden md:table-cell">Last Heartbeat</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.role} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium text-gray-200">{a.role}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{a.adapter ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        a.status === 'idle' ? 'bg-green-900/40 text-green-400'
                        : a.status === 'busy' || a.status === 'active' ? 'bg-blue-900/40 text-blue-400'
                        : a.status === 'error' ? 'bg-red-900/40 text-red-400'
                        : 'bg-gray-800 text-gray-500'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3">
                      <span className={`text-xs ${freshnessColor(a.freshness)}`}>
                        {a.freshness}
                        {a.age_hours != null && ` (${a.age_hours}h)`}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                      {a.last_heartbeat ? new Date(a.last_heartbeat).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
