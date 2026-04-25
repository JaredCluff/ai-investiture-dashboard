import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import { usePoll } from '../hooks/usePoll'
import StatusBadge from '../components/StatusBadge'
import Disclaimer from '../components/Disclaimer'

interface ResearchReport {
  id: string
  title: string
  author_role: string
  date: string | null
  summary: string
  legal_approval: string
}

type SortKey = 'date_desc' | 'date_asc' | 'title_asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc',  label: 'Oldest first' },
  { value: 'title_asc', label: 'Title A–Z' },
]

const AUTHOR_LABELS: Record<string, string> = {
  researcher: 'Researcher',
  cto:        'CTO',
  qa:         'QA',
}

function parseDate(s: string | null): number {
  if (!s) return 0
  const d = new Date(s)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_\n]+)_{1,3}/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*>]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(re)
  return parts.map((part, i) =>
    re.test(part)
      ? <mark key={i} className="bg-yellow-400/20 text-yellow-300 rounded-sm px-0.5">{part}</mark>
      : part
  )
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
  const [params, setParams] = useSearchParams()
  const { data: reports, loading, error } = usePoll<ResearchReport[]>('/api/research', 300_000)

  const q      = params.get('q') ?? ''
  const sort   = (params.get('sort') ?? 'date_desc') as SortKey
  const author = params.get('author') ?? 'all'

  const setParam = useCallback((key: string, value: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === '' || value === 'all' || value === 'date_desc') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      // Reset to page 1 on filter/search change
      return next
    }, { replace: true })
  }, [setParams])

  const clearAll = useCallback(() => setParams({}, { replace: true }), [setParams])

  const allReports = reports ?? []
  const authorRoles = useMemo(
    () => Array.from(new Set(allReports.map(r => r.author_role))).sort(),
    [allReports]
  )

  const filtered = useMemo(() => {
    let list = [...allReports]

    // Search
    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(lq) ||
        r.summary.toLowerCase().includes(lq) ||
        r.author_role.toLowerCase().includes(lq)
      )
    }

    // Author filter
    if (author !== 'all') {
      list = list.filter(r => r.author_role === author)
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title)
      if (sort === 'date_asc')  return parseDate(a.date) - parseDate(b.date)
      return parseDate(b.date) - parseDate(a.date) // date_desc default
    })

    return list
  }, [allReports, q, author, sort])

  const hasActiveFilters = q !== '' || author !== 'all' || sort !== 'date_desc'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Research</h1>
          <p className="text-sm text-gray-500 mt-1">Analysis and reports from AI agents</p>
        </div>
        {!loading && (
          <span className="text-xs text-gray-600 shrink-0 mt-1">
            {filtered.length} of {allReports.length} report{allReports.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Disclaimer variant="banner" />

      {/* Controls */}
      {!loading && allReports.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <input
              type="search"
              value={q}
              onChange={e => setParam('q', e.target.value)}
              placeholder="Search reports…"
              aria-label="Search research reports"
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 pl-8 focus:outline-none focus:border-gray-500 placeholder-gray-600"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>

          {/* Author filter */}
          <select
            value={author}
            onChange={e => setParam('author', e.target.value)}
            aria-label="Filter by author"
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="all">All authors</option>
            {authorRoles.map(role => (
              <option key={role} value={role}>{AUTHOR_LABELS[role] ?? role}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
            aria-label="Sort reports"
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-600 rounded px-2.5 py-2 transition-colors whitespace-nowrap"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading && <Skeleton />}

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Failed to load research reports: {error}
        </div>
      )}

      {!loading && !error && allReports.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-8 text-center text-sm text-gray-500">
          No research reports yet
        </div>
      )}

      {!loading && allReports.length > 0 && filtered.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-10 text-center space-y-2">
          <p className="text-sm text-gray-400">No research reports match your filters</p>
          <button
            onClick={clearAll}
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate(`/research/${report.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-left hover:border-gray-700 hover:bg-gray-900/80 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-100 leading-snug">
                  {highlight(report.title, q)}
                </h2>
                {report.legal_approval === 'required' && (
                  <span className="shrink-0 text-xs bg-yellow-900/30 text-yellow-500 border border-yellow-800/40 rounded px-1.5 py-0.5" title="Requires Legal approval to view">
                    Legal
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="active" label={AUTHOR_LABELS[report.author_role] ?? report.author_role} size="sm" />
                {report.date && (
                  <span className="text-xs text-gray-500">{report.date}</span>
                )}
              </div>
              {report.summary && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                  {highlight(stripMarkdown(report.summary), q)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
