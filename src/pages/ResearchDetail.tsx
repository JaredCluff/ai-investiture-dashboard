import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'

interface ReportDetail {
  id: string
  title: string
  author_role: string
  date: string | null
  summary: string
  content: string
}

export default function ResearchDetail() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/research/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<ReportDetail>
      })
      .then((data) => {
        setReport(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })
  }, [id])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/research"
          className="text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          ← Research
        </Link>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          <div className="space-y-2 mt-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          {error === 'HTTP 404' ? 'Report not found.' : `Failed to load report: ${error}`}
        </div>
      )}

      {!loading && report && (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-100">{report.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{report.author_role}</span>
              {report.date && (
                <>
                  <span className="text-gray-700">·</span>
                  <span>{report.date}</span>
                </>
              )}
            </div>
          </div>

          <MarkdownRenderer content={report.content} />
        </>
      )}
    </div>
  )
}
