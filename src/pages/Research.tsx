import { useNavigate } from 'react-router-dom'
import { usePoll } from '../hooks/usePoll'
import StatusBadge from '../components/StatusBadge'

interface ResearchReport {
  id: string
  title: string
  author_role: string
  date: string | null
  summary: string
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-5 animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-3/4" />
          <div className="h-3 bg-gray-800 rounded w-1/4" />
          <div className="h-3 bg-gray-800 rounded w-full" />
          <div className="h-3 bg-gray-800 rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}

export default function Research() {
  const navigate = useNavigate()
  const { data: reports, loading, error } = usePoll<ResearchReport[]>('/api/research', 300_000)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Research</h1>
        <p className="text-sm text-gray-500 mt-1">Regulatory research and analysis from AI agents</p>
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Failed to load research reports: {error}
        </div>
      )}

      {!loading && !error && reports && reports.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-8 text-center text-sm text-gray-500">
          No research reports yet
        </div>
      )}

      {!loading && reports && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate(`/research/${report.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-left hover:border-gray-700 hover:bg-gray-900/80 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-100 leading-snug">{report.title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="active" label={report.author_role} size="sm" />
                {report.date && (
                  <span className="text-xs text-gray-500">{report.date}</span>
                )}
              </div>
              {report.summary && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{report.summary}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
