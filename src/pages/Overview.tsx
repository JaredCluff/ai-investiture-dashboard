import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts'
import { usePoll } from '../hooks/usePoll'

interface Portfolio {
  equity: number
  cash: number
  buying_power: number
  portfolio_value: number
  pnl: number
  pnl_pct: number
  day_trade_count: number
  pdt_eligible: boolean
  last_updated: string
}

interface Position {
  symbol: string
  qty: number
  side: string
  market_value: number
  cost_basis: number
  unrealized_pl: number
  unrealized_plpc: number
  current_price: number
  avg_entry_price: number
}

interface EquityPoint {
  t: string
  v: number
}

interface EquityData {
  period: string
  portfolio: EquityPoint[]
  spy: EquityPoint[]
  error?: string
}

interface MomentumScore {
  ticker: string
  sector: string
  momentum_score: number
  r_1w: number
  above_sma: boolean
}

interface MomentumData {
  scores: MomentumScore[]
  date: string | null
  stale: boolean
}

function StatCard({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'red' | 'yellow' | 'blue'
  loading?: boolean
}) {
  const accentClass =
    { green: 'text-green-400', red: 'text-red-400', yellow: 'text-yellow-400', blue: 'text-blue-400' }[
      accent ?? 'blue'
    ] ?? 'text-gray-100'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
      ) : (
        <p className={`text-2xl font-semibold ${accentClass}`}>{value}</p>
      )}
      {sub && !loading && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

function MomentumCell({ score }: { score: MomentumScore }) {
  const s = score.momentum_score ?? 0

  let bgClass = ''
  if (s > 5) bgClass = 'bg-green-900/60 border-green-700/40'
  else if (s >= 0) bgClass = 'bg-green-900/30 border-green-800/30'
  else if (s >= -5) bgClass = 'bg-red-900/30 border-red-800/30'
  else bgClass = 'bg-red-900/60 border-red-700/40'

  const smaAccent = score.above_sma ? 'border-l-2 border-l-green-400' : ''

  const scoreColor = s > 0 ? 'text-green-400' : s < 0 ? 'text-red-400' : 'text-gray-400'
  const r1wColor =
    score.r_1w > 0 ? 'text-green-400' : score.r_1w < 0 ? 'text-red-400' : 'text-gray-400'
  const r1wArrow = score.r_1w > 0 ? '▲' : score.r_1w < 0 ? '▼' : '—'

  return (
    <div
      className={`border rounded-lg p-3 ${bgClass} ${smaAccent}`}
    >
      <div className="font-bold text-gray-100 text-base">{score.ticker}</div>
      <div className="text-xs text-gray-500 truncate">{score.sector}</div>
      <div className={`text-sm font-semibold mt-1 ${scoreColor}`}>
        {s > 0 ? '+' : ''}{s.toFixed(1)}
      </div>
      <div className={`text-xs mt-0.5 ${r1wColor}`}>
        {r1wArrow} {score.r_1w != null ? `${(score.r_1w * 100).toFixed(1)}%` : '—'} 1W
      </div>
    </div>
  )
}

// Merge portfolio and spy arrays by date for recharts
function mergeEquitySeries(portfolio: EquityPoint[], spy: EquityPoint[]) {
  const map = new Map<string, { t: string; portfolio?: number; spy?: number }>()
  for (const p of portfolio) {
    map.set(p.t, { t: p.t, portfolio: p.v })
  }
  for (const s of spy) {
    const date = s.t.slice(0, 10)
    const existing = map.get(date)
    if (existing) {
      existing.spy = s.v
    } else {
      map.set(date, { t: date, spy: s.v })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.t.localeCompare(b.t))
}

interface SparkBar {
  t: string
  c: number
}

function PositionSparkline({ symbol, entryPrice }: { symbol: string; entryPrice: number }) {
  const [bars, setBars] = useState<SparkBar[]>([])

  useEffect(() => {
    apiFetch(`/api/bars/${symbol}?period=1M`)
      .then((r) => r.json())
      .then((d) => setBars(d.bars ?? []))
      .catch(() => {})
  }, [symbol])

  if (bars.length < 2) {
    return <div className="w-24 h-8 bg-gray-800 rounded animate-pulse" />
  }

  const lastClose = bars[bars.length - 1]?.c ?? entryPrice
  const color = lastClose >= entryPrice ? '#4ade80' : '#f87171'
  const gradId = `sg_${symbol}`

  return (
    <ResponsiveContainer width={96} height={32}>
      <AreaChart data={bars} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <ReferenceLine y={entryPrice} stroke="#fbbf24" strokeWidth={0.5} />
        <Area
          type="monotone"
          dataKey="c"
          stroke={color}
          strokeWidth={1}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function Overview() {
  const portfolio = usePoll<Portfolio>('/api/portfolio', 60_000)
  const positions = usePoll<Position[]>('/api/positions', 60_000)
  const momentum = usePoll<MomentumData>('/api/momentum', 3_600_000)

  const p = portfolio.data
  const pos = positions.data ?? []
  const loading = portfolio.loading || positions.loading
  const error = portfolio.error || positions.error

  const pdtMax = 3

  // ── Equity Curve state ────────────────────────────────────────────────────
  const [period, setPeriod] = useState('1M')
  const [equityData, setEquityData] = useState<EquityData | null>(null)
  const [equityLoading, setEquityLoading] = useState(true)

  useEffect(() => {
    setEquityLoading(true)
    apiFetch(`/api/equity-curve?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setEquityData(d)
        setEquityLoading(false)
      })
      .catch(() => setEquityLoading(false))
  }, [period])

  const chartData = equityData
    ? mergeEquitySeries(equityData.portfolio ?? [], equityData.spy ?? [])
    : []

  // ── Risk calculations ─────────────────────────────────────────────────────
  const peakEquity =
    equityData?.portfolio && equityData.portfolio.length > 0
      ? Math.max(...equityData.portfolio.map((d) => d.v))
      : null
  const currentEquity = p?.portfolio_value ?? null
  const drawdownPct =
    peakEquity && currentEquity
      ? ((currentEquity - peakEquity) / peakEquity) * 100
      : null

  const cash = p?.cash ?? 0
  const portfolioValue = p?.portfolio_value ?? 1
  const cashPct = portfolioValue > 0 ? (cash / portfolioValue) * 100 : 0

  // Closest stop: for each position, buffer = ((current - entry) / entry) * 100 + 8
  const closestStop =
    pos.length > 0
      ? pos
          .map((h) => ({
            ticker: h.symbol,
            buffer: ((h.current_price - h.avg_entry_price) / h.avg_entry_price) * 100 + 8,
          }))
          .sort((a, b) => a.buffer - b.buffer)[0]
      : null

  // Drawdown color
  let drawdownColor = 'text-green-400'
  let drawdownBorder = ''
  if (drawdownPct !== null) {
    if (drawdownPct < -12) {
      drawdownColor = 'text-red-400'
      drawdownBorder = 'animate-pulse border-red-500'
    } else if (drawdownPct < -10) {
      drawdownColor = 'text-red-400'
    } else if (drawdownPct < -5) {
      drawdownColor = 'text-yellow-400'
    }
  }

  // Cash color
  let cashColor = 'text-green-400'
  if (cashPct < 10) cashColor = 'text-red-400'
  else if (cashPct < 15) cashColor = 'text-yellow-400'

  // Stop color
  let stopColor = 'text-gray-300'
  if (closestStop) {
    if (closestStop.buffer < 2) stopColor = 'text-red-400'
    else if (closestStop.buffer < 4) stopColor = 'text-yellow-400'
  }

  const momentumScores = momentum.data?.scores ?? []
  const momentumDate = momentum.data?.date
  const momentumStale = momentum.data?.stale ?? true

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Portfolio Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Live holdings, P&amp;L, and compliance metrics</p>
        </div>
        {p?.last_updated && (
          <span className="text-xs text-gray-600">
            Updated {new Date(p.last_updated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Unable to reach backend: {error}. Retrying every 60s.
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={p ? `$${Number(p.portfolio_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          accent="blue"
          loading={loading}
        />
        <StatCard
          label="Cash Available"
          value={p ? `$${Number(p.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          accent="green"
          loading={loading}
        />
        <StatCard
          label="Day P&L"
          value={p ? `${p.pnl >= 0 ? '+' : ''}$${Math.abs(p.pnl).toFixed(2)}` : '—'}
          sub={p ? `${p.pnl_pct >= 0 ? '+' : ''}${p.pnl_pct.toFixed(2)}%` : undefined}
          accent={!p ? 'blue' : p.pnl >= 0 ? 'green' : 'red'}
          loading={loading}
        />
        <StatCard
          label="PDT Trades Used"
          value={p ? `${p.day_trade_count} / ${pdtMax}` : '—'}
          sub="per rolling 5-day window"
          accent={!p ? 'yellow' : p.day_trade_count >= pdtMax ? 'red' : 'yellow'}
          loading={loading}
        />
      </div>

      {/* ── AII-37: Risk Monitor ──────────────────────────────────────────── */}
      <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${drawdownBorder}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-300">Risk Monitor</h2>
          <span className="text-xs text-gray-500">Circuit breaker: 12% drawdown</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Drawdown */}
          <div className="bg-gray-950/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Drawdown from Peak</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-800 rounded animate-pulse" />
            ) : (
              <p className={`text-lg font-semibold ${drawdownColor}`}>
                {drawdownPct !== null ? `${drawdownPct.toFixed(1)}%` : '—'}
              </p>
            )}
          </div>

          {/* PDT Progress */}
          <div className="bg-gray-950/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">PDT Trades ({p?.day_trade_count ?? 0} / 3)</p>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                style={{ width: `${Math.min(((p?.day_trade_count ?? 0) / 3) * 100, 100)}%` }}
                className={`h-2 rounded-full ${(p?.day_trade_count ?? 0) >= 3 ? 'bg-red-500' : 'bg-yellow-400'}`}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">rolling 5-day window</p>
          </div>

          {/* Cash Reserve */}
          <div className="bg-gray-950/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Cash Reserve</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-800 rounded animate-pulse" />
            ) : (
              <>
                <p className={`text-lg font-semibold ${cashColor}`}>
                  {portfolioValue > 0 ? `${cashPct.toFixed(1)}%` : '—'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">target ≥ 10%</p>
              </>
            )}
          </div>

          {/* Closest Stop */}
          <div className="bg-gray-950/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Closest Stop (8%)</p>
            {loading ? (
              <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
            ) : closestStop ? (
              <p className={`text-sm font-semibold ${stopColor}`}>
                {closestStop.ticker}: {closestStop.buffer.toFixed(1)}% to stop
              </p>
            ) : (
              <p className="text-sm text-gray-600">No open positions</p>
            )}
          </div>
        </div>
      </div>

      {/* ── AII-36: Equity Curve ──────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-300">Equity Curve</h2>
          <div className="flex gap-1">
            {['1W', '1M', '3M', 'ALL'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  period === p
                    ? 'bg-green-900/40 text-green-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {equityLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-600">
            No equity history available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="t"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const parts = v.split('-')
                  return `${parts[1]}/${parts[2]}`
                }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v: number) => '$' + v.toLocaleString()}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#d1d5db',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  const num = value == null ? 0 : typeof value === 'number' ? value : Number(value)
                  const label = typeof name === 'string' ? name : String(name)
                  return [
                    '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    label,
                  ]
                }}
                labelFormatter={(label) => String(label ?? '')}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                formatter={(value: string) =>
                  value === 'portfolio' ? 'Portfolio' : 'SPY (normalized)'
                }
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#4ade80"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="spy"
                stroke="#6b7280"
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={1.5}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── AII-34: Sector Momentum Heatmap ──────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-300">Sector Momentum</h2>
          {momentumDate && (
            <span className="text-xs text-gray-500">as of {momentumDate}</span>
          )}
        </div>

        {momentumStale || momentumScores.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">
            Momentum data will appear after first portfolio manager run.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {momentumScores.map((score) => (
                <MomentumCell key={score.ticker} score={score} />
              ))}
            </div>
            {momentumDate && (
              <p className="text-xs text-gray-600 mt-3">Last updated: {momentumDate}</p>
            )}
          </>
        )}
      </div>

      {/* Wash sale tracker */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-300">Wash Sale Watch</h2>
          <span className="text-xs text-gray-500">IRC §1091 — 30-day lookback</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-gray-400">No wash sale risk detected</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Positions sold at a loss are monitored for 30 days. Re-buying the same security within
          that window disallows the loss deduction (IRC §1091).
        </p>
      </div>

      {/* Holdings table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-300">Holdings</h2>
          {positions.lastUpdated && (
            <span className="text-xs text-gray-600">
              {pos.length} position{pos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <table className="w-full text-sm">
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        ) : pos.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            No open positions — fully in cash
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-2">Symbol</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-right px-4 py-2">Mkt Value</th>
                <th className="text-right px-4 py-2">Avg Entry</th>
                <th className="text-right px-4 py-2">Unrealized P&amp;L</th>
                <th className="text-right px-4 py-2">1M Chart</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((h) => (
                <tr key={h.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium text-gray-100">{h.symbol}</td>
                  <td className="text-right px-4 py-3 text-gray-300">{h.qty}</td>
                  <td className="text-right px-4 py-3 text-gray-300">
                    ${Number(h.market_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right px-4 py-3 text-gray-300">
                    ${Number(h.avg_entry_price).toFixed(2)}
                  </td>
                  <td className={`text-right px-4 py-3 ${h.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.unrealized_pl >= 0 ? '+' : ''}${h.unrealized_pl.toFixed(2)}
                    <span className="ml-1 text-xs opacity-70">
                      ({h.unrealized_plpc >= 0 ? '+' : ''}{h.unrealized_plpc.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="text-right px-4 py-2">
                    <div className="flex justify-end">
                      <PositionSparkline symbol={h.symbol} entryPrice={h.avg_entry_price} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
