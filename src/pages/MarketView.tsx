import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../lib/api'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

const COMMON_TICKERS = ['SPY', 'XLE', 'XLF', 'XLK', 'XLU', 'XLV', 'XLI', 'XLC', 'XLY', 'XLP', 'XLRE']
const PERIODS = ['1D', '1W', '1M', '3M'] as const
type Period = (typeof PERIODS)[number]

interface Bar {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface BarsResponse {
  symbol: string
  period: string
  bars: Bar[]
}

interface Position {
  symbol: string
  avg_entry_price: number
  current_price: number
  unrealized_pl: number
  unrealized_plpc: number
  qty: number
  market_value: number
  cost_basis: number
  side: string
}

function formatDate(t: string, period: Period): string {
  const d = new Date(t)
  if (period === '1D') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function VolumeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Bar }> }) {
  if (!active || !payload?.[0]) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400">
      Vol: {payload[0].payload.v?.toLocaleString()}
    </div>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Bar }> }) {
  if (!active || !payload?.[0]) return null
  const b = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{new Date(b.t).toLocaleString()}</p>
      <p className="text-gray-300">
        O: <span className="text-white">${b.o?.toFixed(2)}</span>
      </p>
      <p className="text-gray-300">
        H: <span className="text-green-400">${b.h?.toFixed(2)}</span>
      </p>
      <p className="text-gray-300">
        L: <span className="text-red-400">${b.l?.toFixed(2)}</span>
      </p>
      <p className="text-gray-300">
        C: <span className="text-white">${b.c?.toFixed(2)}</span>
      </p>
      <p className="text-gray-300">
        V: <span className="text-blue-400">{b.v?.toLocaleString()}</span>
      </p>
    </div>
  )
}

export default function MarketView() {
  const [symbol, setSymbol] = useState('SPY')
  const [inputValue, setInputValue] = useState('SPY')
  const [period, setPeriod] = useState<Period>('1M')
  const [barsData, setBarsData] = useState<BarsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch positions on mount
  useEffect(() => {
    apiFetch('/api/positions')
      .then((r) => r.json())
      .then((d) => setPositions(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  // Fetch bars whenever symbol or period changes
  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch(`/api/bars/${symbol}?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: BarsResponse) => {
        setBarsData(d)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [symbol, period])

  const bars = barsData?.bars ?? []

  // Stats
  const lastBar = bars.length > 0 ? bars[bars.length - 1] : undefined
  const prevBar = bars.length > 1 ? bars[bars.length - 2] : undefined
  const currentPrice = lastBar?.c ?? null
  const dayChange = currentPrice !== null && prevBar !== undefined ? currentPrice - prevBar.c : null
  const dayChangePct = dayChange !== null && prevBar !== undefined && prevBar.c !== 0 ? (dayChange / prevBar.c) * 100 : null
  const high52 = bars.length > 0 ? Math.max(...bars.map((b) => b.h ?? 0)) : null
  const low52 = bars.length > 0 ? Math.min(...bars.map((b) => b.l ?? Infinity)) : null

  // Entry price for current symbol if held
  const holding = positions.find((p) => p.symbol === symbol)
  const entryPrice = holding ? holding.avg_entry_price : null

  function handleTickerClick(ticker: string) {
    setSymbol(ticker)
    setInputValue(ticker)
  }

  function handleInputSubmit() {
    const trimmed = inputValue.trim().toUpperCase()
    if (trimmed) {
      setSymbol(trimmed)
      setInputValue(trimmed)
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleInputSubmit()
  }

  const priceColor = dayChange !== null ? (dayChange >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-300'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Market View</h1>
          <p className="text-sm text-gray-500 mt-1">Candlestick charts and position performance</p>
        </div>
        {holding && (
          <span className="inline-flex items-center gap-1.5 text-xs text-yellow-400 border border-yellow-700/50 bg-yellow-900/20 rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
            Holding {symbol}
          </span>
        )}
      </div>

      {/* Symbol selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputSubmit}
            placeholder="Enter symbol..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gray-500 w-32 uppercase"
          />
          <button
            onClick={handleInputSubmit}
            className="text-xs px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
          >
            Go
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_TICKERS.map((t) => (
            <button
              key={t}
              onClick={() => handleTickerClick(t)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                symbol === t
                  ? 'bg-green-900/40 border-green-700/50 text-green-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!loading && currentPrice && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Last Price</p>
            <p className="text-2xl font-semibold text-gray-100">${currentPrice.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Period Change</p>
            <p className={`text-2xl font-semibold ${priceColor}`}>
              {dayChange !== null ? `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}` : '—'}
            </p>
            {dayChangePct !== null && (
              <p className={`text-xs mt-1 ${priceColor}`}>
                {dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}%
              </p>
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Period High</p>
            <p className="text-2xl font-semibold text-green-400">
              {high52 ? `$${high52.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Period Low</p>
            <p className="text-2xl font-semibold text-red-400">
              {low52 ? `$${low52.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Price chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            {symbol}
            {entryPrice && (
              <span className="ml-2 text-xs text-yellow-400 font-normal">
                entry @ ${entryPrice.toFixed(2)}
              </span>
            )}
          </span>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
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

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-sm text-red-400">
            Failed to load bars: {error}
          </div>
        ) : bars.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-600">
            No data available for {symbol}
          </div>
        ) : (
          <div className="px-2 pt-4 pb-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={bars} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="t"
                  tickFormatter={(t: string) => formatDate(t, period)}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  minTickGap={40}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                {entryPrice && (
                  <ReferenceLine
                    y={entryPrice}
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                    label={{ value: `Entry $${entryPrice.toFixed(2)}`, fill: '#fbbf24', fontSize: 10, position: 'right' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="c"
                  stroke="#4ade80"
                  fill="url(#priceGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Volume chart */}
        {!loading && !error && bars.length > 0 && (
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={bars} margin={{ top: 0, right: 12, left: 8, bottom: 4 }}>
                <XAxis dataKey="t" hide />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                  }
                  tick={{ fill: '#6b7280', fontSize: 9 }}
                  width={40}
                />
                <Tooltip content={<VolumeTooltip />} />
                <Bar dataKey="v" fill="#374151" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
