import { useState, useRef } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'

interface SearchResult {
  title?: string
  snippet?: string
  source?: string
  score?: number
}

interface SearchResponse {
  answer?: string | null
  answer_confidence?: number | null
  citations?: any[]
  chunks?: SearchResult[]
  error?: string
  query_type?: string
  processing_time_ms?: number
}

const EXAMPLE_QUERIES = [
  'What is the momentum ETF rotation strategy?',
  'How does PDT rule affect our trading frequency?',
  'What research led to selecting Alpaca as our broker?',
]

export default function Search() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isKnOffline =
    !!response?.error &&
    (response.error.toLowerCase().includes('connect') ||
      response.error.toLowerCase().includes('unavailable') ||
      response.error.toLowerCase().includes('offline') ||
      response.error.toLowerCase().includes('connection'))

  async function doSearch(q: string) {
    if (!q.trim()) return
    setSearching(true)
    setResponse(null)
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(q)}&limit=10`, {
        method: 'POST',
      })
      const data: SearchResponse = await res.json()
      setResponse(data)
    } catch {
      setResponse({ error: 'Search unavailable', answer: null, citations: [], chunks: [] })
    } finally {
      setSearching(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      doSearch(query)
    }
  }

  function handleExampleClick(q: string) {
    setQuery(q)
    doSearch(q)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Ask AI-Investiture</h1>
          <p className="text-sm text-gray-500 mt-1">
            Powered by Knowledge Nexus · Semantic search across all research, blog posts, and strategy documents
          </p>
        </div>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs bg-green-950/50 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Knowledge Nexus
        </span>
      </div>

      {/* Search input */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-600 transition-colors text-sm"
          placeholder="Ask anything about AI-Investiture strategy, research, or portfolio..."
          autoFocus
        />
        <button
          onClick={() => doSearch(query)}
          disabled={searching || !query.trim()}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors shrink-0"
        >
          Ask
        </button>
      </div>

      {/* Example queries (shown when input is empty and no response yet) */}
      {!query.trim() && !response && !searching && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Example questions</p>
          <div className="flex flex-col gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleExampleClick(q)}
                className="text-left text-sm text-gray-400 hover:text-green-400 bg-gray-900/50 border border-gray-800 hover:border-green-800/50 rounded-lg px-4 py-2.5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {searching && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <svg className="animate-spin h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="animate-pulse">Searching knowledge base...</span>
        </div>
      )}

      {/* KN offline error */}
      {response?.error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          {isKnOffline
            ? 'Knowledge Nexus is offline — search unavailable'
            : `Search error: ${response.error}`}
        </div>
      )}

      {/* Results */}
      {!searching && response && !response.error && (
        <div className="space-y-4">
          {/* Meta: query type + processing time */}
          {(response.query_type || response.processing_time_ms !== undefined) && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {response.query_type && (
                <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                  {response.query_type}
                </span>
              )}
              {response.processing_time_ms !== undefined && (
                <span>{response.processing_time_ms}ms</span>
              )}
            </div>
          )}

          {/* AI Answer */}
          {response.answer && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-200">Answer</h2>
                {response.answer_confidence !== null && response.answer_confidence !== undefined && (
                  <span className="text-xs bg-green-950/50 text-green-400 border border-green-800/40 px-2 py-0.5 rounded-full">
                    {Math.round(response.answer_confidence * 100)}% confident
                  </span>
                )}
              </div>
              <MarkdownRenderer content={response.answer} />
            </div>
          )}

          {/* Source chunks */}
          {response.chunks && response.chunks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sources</h3>
              {response.chunks.map((chunk, idx) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-200">
                      {chunk.title || chunk.source || `Source ${idx + 1}`}
                    </h4>
                    {chunk.score !== undefined && (
                      <span className="text-xs text-gray-600 shrink-0">
                        {(chunk.score * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>
                  {chunk.source && chunk.title && (
                    <p className="text-xs text-gray-600">{chunk.source}</p>
                  )}
                  {chunk.snippet && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
                      {chunk.snippet}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!response.answer && (!response.chunks || response.chunks.length === 0) && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
