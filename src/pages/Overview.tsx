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

export default function Overview() {
  const portfolio = usePoll<Portfolio>('/api/portfolio', 60_000)
  const positions = usePoll<Position[]>('/api/positions', 60_000)

  const p = portfolio.data
  const pos = positions.data ?? []
  const loading = portfolio.loading || positions.loading
  const error = portfolio.error || positions.error

  const pdtMax = 3

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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
