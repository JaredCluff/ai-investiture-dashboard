import { usePoll } from '../hooks/usePoll'
import Disclaimer from '../components/Disclaimer'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface DailyView {
  date: string
  views: number
}

interface TopPage {
  path: string
  views: number
}

interface AnalyticsStats {
  total_pageviews: number
  days: number
  daily: DailyView[]
  top_pages: TopPage[]
  top_referrers: { domain: string; views: number }[]
  screen_breakdown: Record<string, number>
}

interface SocialPost {
  id: string
  scheduled_date: string
  platform: string
  type: string
  status: 'draft' | 'pending_legal' | 'approved' | 'published'
  source_blog: string | null
  text: string
}

interface MarketingQueue {
  primary_channel: string
  handle: string
  total: number
  posts: SocialPost[]
}

const STATUS_STYLES: Record<string, string> = {
  draft:         'bg-gray-800 text-gray-400',
  pending_legal: 'bg-yellow-900/40 text-yellow-400',
  approved:      'bg-blue-900/40 text-blue-300',
  published:     'bg-green-900/40 text-green-400',
}

const TYPE_LABELS: Record<string, string> = {
  rebalance_summary:  'Rebalance',
  behind_the_scenes:  'BTS',
  research_highlight: 'Research',
  portfolio_checkin:  'Check-in',
  week_in_review:     'Week Review',
  trade_thread:       'Trade Thread',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function Marketing() {
  const { data: stats, loading: statsLoading } = usePoll<AnalyticsStats>('/api/analytics/stats?days=30', 300_000)
  const { data: queue, loading: queueLoading } = usePoll<MarketingQueue>('/api/marketing/queue', 300_000)

  const totalViews = stats?.total_pageviews ?? 0
  const dailyData = stats?.daily ?? []
  const topPages = stats?.top_pages ?? []
  const screens = stats?.screen_breakdown ?? {}
  const mobileShare = screens.mobile && totalViews
    ? Math.round((screens.mobile / totalViews) * 100)
    : null

  const posts = queue?.posts ?? []
  const publishedCount = posts.filter(p => p.status === 'published').length
  const pendingCount = posts.filter(p => p.status === 'pending_legal' || p.status === 'draft').length

  // Keep last 14 days of chart data
  const chartData = dailyData.slice(-14).map(d => ({
    date: d.date.slice(5), // MM-DD
    views: d.views,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">Distribution, audience metrics, and content queue</p>
        </div>
        {queue?.handle && (
          <span className="text-xs font-mono text-green-400 border border-green-800/50 bg-green-900/20 rounded px-2 py-1">
            {queue.handle}
          </span>
        )}
      </div>

      <Disclaimer variant="compact" />

      {/* Audience Metrics */}
      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Audience Metrics — Last 30 Days</h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Page Views" value={totalViews.toLocaleString()} sub="last 30 days" />
            <StatCard label="Unique Pages Viewed" value={topPages.length} sub="distinct paths" />
            <StatCard
              label="Mobile Share"
              value={mobileShare != null ? `${mobileShare}%` : '—'}
              sub="of sessions"
            />
            <StatCard
              label="Social Posts Queued"
              value={queue ? posts.length : '—'}
              sub={`${publishedCount} published · ${pendingCount} pending`}
            />
          </div>
        )}
      </section>

      {/* Pageview Chart */}
      {!statsLoading && chartData.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Daily Pageviews</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#4ade80' }}
                />
                <Bar dataKey="views" fill="#16a34a" radius={[2, 2, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Top Pages */}
      {!statsLoading && topPages.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Top Pages</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {topPages.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60 last:border-0">
                <span className="font-mono text-xs text-gray-400 truncate">{p.path}</span>
                <span className="text-xs text-gray-300 ml-4 shrink-0">{p.views} views</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content Calendar */}
      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Weekly Content Cadence</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {[
            { day: 'Sunday', type: 'Weekly rebalance review', note: 'After market close' },
            { day: 'Monday', type: 'Social: rebalance highlight', note: 'Tweet summary' },
            { day: 'Tuesday', type: 'Research or analysis', note: 'When applicable' },
            { day: 'Wednesday', type: 'Behind the scenes', note: 'Agent infra / tech' },
            { day: 'Thursday', type: 'Portfolio check-in', note: 'Mid-week snapshot' },
            { day: 'Friday', type: 'Week in review', note: 'Social summary' },
            { day: '1st of month', type: 'Monthly report', note: 'Full P&L + attribution' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-800/60 last:border-0">
              <span className="text-xs font-medium text-gray-300 w-28 shrink-0">{row.day}</span>
              <span className="text-xs text-gray-400 flex-1">{row.type}</span>
              <span className="text-xs text-gray-600 hidden sm:inline">{row.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Social Queue */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-medium">Scheduled Posts — Weeks 1–2</h2>
          {!queueLoading && queue && (
            <span className="text-xs text-gray-600">{posts.length} posts · {queue.primary_channel}</span>
          )}
        </div>
        {queueLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-10 text-center text-sm text-gray-600">
            No scheduled posts found
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-500">{post.scheduled_date}</span>
                  <span className="text-xs text-gray-700">·</span>
                  <span className="text-xs text-gray-500 capitalize">{TYPE_LABELS[post.type] ?? post.type}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ml-auto capitalize ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}
                  >
                    {post.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{post.text}</p>
                {post.source_blog && (
                  <p className="text-xs text-gray-600">
                    Source: <span className="font-mono">{post.source_blog}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Brand note */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg px-4 py-3 text-xs text-gray-600">
        <strong className="text-gray-500">Brand guidelines:</strong> Voice is technically credible, dry-witted, and transparent to a fault.
        Never claim certainty about market direction. Always include disclaimer on financial content.
        Full guidelines at <span className="font-mono">docs/brand-guidelines.md</span> (AII-337).
      </div>
    </div>
  )
}
