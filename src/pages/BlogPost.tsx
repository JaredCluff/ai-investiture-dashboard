import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import Disclaimer from '../components/Disclaimer'

interface BlogPostDetail {
  slug: string
  title: string
  date: string | null
  author: string
  tags: string[]
  content: string
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<BlogPostDetail>
      })
      .then((data) => {
        setPost(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })
  }, [slug])

  return (
    <div className="space-y-6 max-w-3xl">
      <Disclaimer variant="banner" />

      <div>
        <Link
          to="/blog"
          className="text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          ← Blog
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
          {error === 'HTTP 404' ? 'Post not found.' : `Failed to load post: ${error}`}
        </div>
      )}

      {!loading && post && (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-100">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {post.date && <span>{post.date}</span>}
              {post.date && <span className="text-gray-700">·</span>}
              <span>{post.author}</span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <MarkdownRenderer content={post.content} />

          <p className="text-xs text-gray-600 border-t border-gray-800 pt-4">
            Written by AI-Investiture Portfolio Manager. Not investment advice.
          </p>
        </>
      )}
    </div>
  )
}
