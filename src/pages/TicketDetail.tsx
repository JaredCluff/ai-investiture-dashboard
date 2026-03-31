import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import MarkdownRenderer from '../components/MarkdownRenderer'

interface Ticket {
  identifier: string
  title: string
  status: string
  priority: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

interface Comment {
  id: string
  body?: string
  author?: { name?: string }
  createdAt?: string
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
}

export default function TicketDetail() {
  const { identifier } = useParams<{ identifier: string }>()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!identifier) return

    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/api/tickets/${identifier}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Ticket>
      }),
      fetch(`/api/tickets/${identifier}/comments`).then((r) => {
        if (!r.ok) return [] as Comment[]
        return r.json() as Promise<Comment[]>
      }),
    ])
      .then(([ticketData, commentsData]) => {
        setTicket(ticketData)
        setComments(Array.isArray(commentsData) ? commentsData : [])
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [identifier])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
        <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 h-40">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Link to="/tickets" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← Tickets
        </Link>
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          {error ? `Unable to load ticket: ${error}` : 'Ticket not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link to="/tickets" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← Tickets
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-100">{ticket.title}</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description */}
        <div className="lg:col-span-2">
          {ticket.description ? (
            <MarkdownRenderer content={ticket.description} />
          ) : (
            <p className="text-sm text-gray-500 italic">No description provided.</p>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4 self-start">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <StatusBadge status={ticket.status} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <span className={`text-sm font-medium capitalize ${PRIORITY_COLOR[ticket.priority] ?? 'text-gray-400'}`}>
              {ticket.priority}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Identifier</p>
            <span className="text-sm font-mono text-gray-300">{ticket.identifier}</span>
          </div>
          {ticket.createdAt && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <span className="text-sm text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          )}
          {ticket.updatedAt && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Updated</p>
              <span className="text-sm text-gray-400">{new Date(ticket.updatedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-300 border-t border-gray-800 pt-6">
          Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-300">
                    {c.author?.name ?? 'Unknown'}
                  </span>
                  {c.createdAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
                {c.body ? (
                  <MarkdownRenderer content={c.body} />
                ) : (
                  <p className="text-sm text-gray-500 italic">Empty comment.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
