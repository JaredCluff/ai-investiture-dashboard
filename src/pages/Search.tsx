import { useState, useEffect } from 'react'

interface SearchResult {
  title?: string
  content?: string
  snippet?: string
  score?: number
  source?: string
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 10 }),
        })
        const data = await res.json() as { error?: string; results?: SearchResult[] } | SearchResult[]
        if (!Array.isArray(data) && data.error) {
          setSearchError(data.error)
          setResults([])
        } else {
          const resultList = Array.isArray(data) ? data : (data.results ?? [])
          setResults(resultList)
          setSearchError(null)
        }
      } catch {
        setSearchError('Search unavailable')
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const isKnOffline =
    searchError !== null &&
    (searchError.toLowerCase().includes('connect') ||
      searchError.toLowerCase().includes('unavailable') ||
      searchError.toLowerCase().includes('offline'))

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Search</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search AI-Investiture documents, research, and knowledge base
          </p>
        </div>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs bg-green-950/50 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Powered by Knowledge Nexus
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-600 transition-colors text-sm"
          placeholder="Search documents, research, blog posts..."
          autoFocus
        />
      </div>

      {searching && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Searching...
        </div>
      )}

      {searchError && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          {isKnOffline
            ? 'Search unavailable — Knowledge Nexus offline'
            : `Search error: ${searchError}`}
        </div>
      )}

      {!searching && !searchError && query.trim() && results.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-100">
                  {result.title ?? result.source ?? `Result ${idx + 1}`}
                </h3>
                {result.score !== undefined && (
                  <span className="text-xs text-gray-500 shrink-0">
                    {(result.score * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
              {result.source && result.title && (
                <p className="text-xs text-gray-600">{result.source}</p>
              )}
              {(result.snippet ?? result.content) && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
                  {result.snippet ?? result.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!query.trim() && (
        <div className="text-sm text-gray-600 text-center py-4">
          Search AI-Investiture documents, research, and knowledge base
        </div>
      )}
    </div>
  )
}
