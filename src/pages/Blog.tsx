import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import { usePoll } from '../hooks/usePoll'
import Disclaimer from '../components/Disclaimer'

interface BlogPost {
  slug: string
  title: string
  date: string | null
  author: string
  tags: string[]
  summary: string
}

type SortKey = 'date_desc' | 'date_asc' | 'title_asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc',  label: 'Oldest first' },
  { value: 'title_asc', label: 'Title A–Z' },
]

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
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-5 animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-2/3" />
          <div className="h-3 bg-gray-800 rounded w-1/3" />
          <div className="h-3 bg-gray-800 rounded w-full" />
          <div className="h-3 bg-gray-800 rounded w-4/5" />
        </div>
      ))}
    </div>
  )
}

export default function Blog() {
  const [params, setParams] = useSearchParams()
  const { data: posts, loading, error } = usePoll<BlogPost[]>('/api/blog', 300_000)

  const q      = params.get('q') ?? ''
  const sort   = (params.get('sort') ?? 'date_desc') as SortKey
  const author = params.get('author') ?? 'all'
  const tag    = params.get('tag') ?? 'all'

  const setParam = useCallback((key: string, value: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === '' || value === 'all' || value === 'date_desc') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      return next
    }, { replace: true })
  }, [setParams])

  const clearAll = useCallback(() => setParams({}, { replace: true }), [setParams])

  const allPosts = posts ?? []

  const authors = useMemo(
    () => Array.from(new Set(allPosts.map(p => p.author).filter(Boolean))).sort(),
    [allPosts]
  )

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {}
    allPosts.forEach(p => p.tags.forEach(t => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
  }, [allPosts])

  const filtered = useMemo(() => {
    let list = [...allPosts]

    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(lq) ||
        p.summary.toLowerCase().includes(lq) ||
        p.author.toLowerCase().includes(lq) ||
        p.tags.some(t => t.toLowerCase().includes(lq))
      )
    }

    if (author !== 'all') {
      list = list.filter(p => p.author === author)
    }

    if (tag !== 'all') {
      list = list.filter(p => p.tags.includes(tag))
    }

    list.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title)
      if (sort === 'date_asc')  return (a.date ?? '').localeCompare(b.date ?? '')
      return (b.date ?? '').localeCompare(a.date ?? '') // date_desc default
    })

    return list
  }, [allPosts, q, author, tag, sort])

  const hasActiveFilters = q !== '' || author !== 'all' || tag !== 'all' || sort !== 'date_desc'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Blog</h1>
          <p className="text-sm text-gray-500 mt-1">Portfolio Manager updates</p>
        </div>
        {!loading && (
          <span className="text-xs text-gray-600 shrink-0 mt-1">
            {filtered.length} of {allPosts.length} post{allPosts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Disclaimer variant="banner" />

      {/* Controls */}
      {!loading && allPosts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <input
              type="search"
              value={q}
              onChange={e => setParam('q', e.target.value)}
              placeholder="Search posts…"
              aria-label="Search blog posts"
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
            {authors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Tag filter — all tags sorted by frequency */}
          <select
            value={tag}
            onChange={e => setParam('tag', e.target.value)}
            aria-label="Filter by tag"
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="all">All tags</option>
            {allTags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
            aria-label="Sort posts"
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
          Failed to load blog posts: {error}
        </div>
      )}

      {!loading && !error && allPosts.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-8 text-center text-sm text-gray-500">
          No blog posts yet. The Portfolio Manager will publish updates here.
        </div>
      )}

      {!loading && allPosts.length > 0 && filtered.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-10 text-center space-y-2">
          <p className="text-sm text-gray-400">No blog posts match your filters</p>
          <button
            onClick={clearAll}
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((post) => (
            <div
              key={post.slug}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-gray-100 hover:text-green-400 transition-colors leading-snug"
                >
                  {highlight(post.title, q)}
                </Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {post.date && <span>{post.date}</span>}
                {post.date && <span className="text-gray-700">·</span>}
                <span>{highlight(post.author, q)}</span>
              </div>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setParam('tag', t === tag ? 'all' : t)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        t === tag
                          ? 'bg-green-900/40 text-green-400 border border-green-800/50'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      }`}
                      aria-label={t === tag ? `Remove tag filter: ${t}` : `Filter by tag: ${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {post.summary && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                  {highlight(stripMarkdown(post.summary), q)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
