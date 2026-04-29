import { useState } from 'react'
import { usePoll } from '../hooks/usePoll'
import Disclaimer from '../components/Disclaimer'

interface Activity {
  agent: string
  action: string
  identifier: string
  status: string
  timestamp: string
}

const AGENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Engineer':         { bg: 'bg-blue-900/30',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  'Portfolio Manager':{ bg: 'bg-green-900/30',  text: 'text-green-400',  dot: 'bg-green-400' },
  'Researcher':       { bg: 'bg-purple-900/30', text: 'text-purple-400', dot: 'bg-purple-400' },
  'CTO':              { bg: 'bg-yellow-900/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
}

const STATUS_STYLES: Record<string, string> = {
  done:        'bg-green-900/40 text-green-400',
  in_progress: 'bg-blue-900/40 text-blue-300',
  todo:        'bg-gray-800 text-gray-500',
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

export default function Feed() {
  const { data, loading } = usePoll<Activity[]>('/api/activity', 30_000)
  const activities = data ?? []
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-green-400 font-bold text-xl">AI-Investiture</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-300 font-medium">Live Agent Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyLink}
            className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">Live · 30s</span>
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Disclaimer variant="banner" />
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-800 p-4 animate-pulse">
                <div className="h-3 bg-gray-800 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-gray-600">No recent activity</div>
        ) : (
          <div className="space-y-2">
            {activities.map((a) => {
              const colors = AGENT_COLORS[a.agent] ?? { bg: 'bg-gray-900', text: 'text-gray-400', dot: 'bg-gray-500' }
              const statusStyle = STATUS_STYLES[a.status] ?? STATUS_STYLES.todo
              return (
                <div
                  key={a.identifier || a.action}
                  className={`rounded-lg border border-gray-800 p-4 ${colors.bg}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                      <span className={`text-sm font-semibold ${colors.text}`}>{a.agent}</span>
                      {a.identifier && (
                        <span className="text-xs text-gray-600 font-mono">{a.identifier}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.status && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusStyle}`}>
                          {a.status.replace('_', ' ')}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">{relativeTime(a.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-snug">{a.action}</p>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer watermark */}
      <footer className="border-t border-gray-800 py-3 text-center text-xs text-gray-700">
        investments.knowledgenexus.ai · AI-Investiture · Not financial advice
      </footer>
    </div>
  )
}
