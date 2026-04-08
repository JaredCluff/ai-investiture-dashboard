import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../hooks/usePoll'
import StatusBadge from '../components/StatusBadge'

interface Ticket {
  identifier: string
  title: string
  status: string
  priority: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

type ApiResponse = Ticket[] | { issues: Ticket[] }

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function Tickets() {
  const { data: raw, loading, error, lastUpdated } = usePoll<ApiResponse>('/api/tickets', 120_000)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const navigate = useNavigate()

  const tickets: Ticket[] = raw == null
    ? []
    : Array.isArray(raw)
      ? raw
      : (raw as { issues: Ticket[] }).issues ?? []

  const filtered = tickets
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .sort((a, b) => {
      const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return db - da
    })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Sprint board — development backlog and progress</p>
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
          Unable to load tickets: {error}. Retrying every 120s.
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`text-sm px-3 py-1.5 rounded border transition-colors ${
              statusFilter === opt.value
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {!loading && (
          <span className="text-xs text-gray-600 ml-auto self-center">
            {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tickets table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
        {loading ? (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-2.5">Identifier</th>
                <th className="text-left px-4 py-2.5">Title</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-left px-4 py-2.5">Priority</th>
                <th className="text-left px-4 py-2.5">Updated</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">No tickets found</p>
            <p className="text-xs text-gray-600 mt-1">
              {tickets.length === 0 ? 'No tickets have been created yet' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-2.5">Identifier</th>
                <th className="text-left px-4 py-2.5">Title</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-left px-4 py-2.5">Priority</th>
                <th className="text-left px-4 py-2.5">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.identifier}
                  onClick={() => navigate(`/tickets/${t.identifier}`)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.identifier}</td>
                  <td className="px-4 py-3 text-gray-100">{t.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${PRIORITY_COLOR[t.priority] ?? 'text-gray-400'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
