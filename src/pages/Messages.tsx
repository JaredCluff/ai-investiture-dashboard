import { useState } from 'react'
import { usePoll } from '../hooks/usePoll'

interface AgentMessage {
  id: string
  subject: string
  from: string
  to: string
  type: 'task' | 'result' | 'broadcast'
  identifier: string
  preview: string
  timestamp: string
}

const TYPE_DOT: Record<string, string> = {
  task: 'bg-yellow-400',
  result: 'bg-green-400',
  broadcast: 'bg-blue-400',
}

type FilterType = 'all' | 'task' | 'result'

export default function Messages() {
  const { data, loading } = usePoll<AgentMessage[]>('/api/messages', 30_000)
  const [filter, setFilter] = useState<FilterType>('all')

  const messages = data ?? []
  const filtered = filter === 'all' ? messages : messages.filter((m) => m.type === filter)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Message Flow</h1>
        <p className="text-sm text-gray-500 mt-1">Agent communication history via NATS</p>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2">
        {(['all', 'task', 'result'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
              filter === f
                ? 'bg-green-900/40 text-green-400 border border-green-800/50'
                : 'text-gray-400 border border-gray-800 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {f === 'all' ? 'All' : f === 'task' ? 'Tasks' : 'Results'}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs text-gray-600">{filtered.length} messages</span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-gray-800/50">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-800 rounded animate-pulse w-1/3" />
                <div className="h-2 bg-gray-800 rounded animate-pulse w-1/4" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-600">No messages found</div>
        ) : (
          filtered.map((msg, i) => (
            <div key={msg.id || i} className="flex gap-3 py-3 border-b border-gray-800/50 hover:bg-gray-900/30 px-1 rounded">
              {/* Type dot */}
              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[msg.type] ?? 'bg-gray-400'}`} />

              <div className="flex-1 min-w-0">
                {/* From → To */}
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-medium text-blue-400">{msg.from}</span>
                  <span className="text-xs text-gray-600 mx-1">→</span>
                  <span className="text-xs font-medium text-green-400">{msg.to}</span>
                  {msg.identifier && (
                    <>
                      <span className="text-xs text-gray-700 mx-1">·</span>
                      <span className="text-xs text-gray-600">{msg.identifier}</span>
                    </>
                  )}
                </div>

                {/* Subject */}
                <p className="font-mono text-xs text-gray-500 mb-1">{msg.subject}</p>

                {/* Preview */}
                {msg.preview && (
                  <p className="text-xs text-gray-400 leading-relaxed truncate">{msg.preview}</p>
                )}
              </div>

              {/* Timestamp */}
              {msg.timestamp && (
                <div className="shrink-0 text-xs text-gray-600 text-right whitespace-nowrap mt-0.5">
                  {new Date(msg.timestamp).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
