import { Link } from 'react-router-dom'
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
  const { data: posts, loading, error } = usePoll<BlogPost[]>('/api/blog', 300_000)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Blog</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio Manager updates</p>
      </div>

      <Disclaimer variant="banner" />

      {loading && <Skeleton />}

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Failed to load blog posts: {error}
        </div>
      )}

      {!loading && !error && posts && posts.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-8 text-center text-sm text-gray-500">
          No blog posts yet. The Portfolio Manager will publish updates here.
        </div>
      )}

      {!loading && posts && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-gray-100 hover:text-green-400 transition-colors leading-snug"
                >
                  {post.title}
                </Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {post.date && <span>{post.date}</span>}
                {post.date && <span className="text-gray-700">·</span>}
                <span>{post.author}</span>
              </div>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
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
              {post.summary && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{post.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
