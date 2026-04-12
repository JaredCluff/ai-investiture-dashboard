import { useState } from 'react'
import { usePoll } from '../hooks/usePoll'
import StatusBadge from '../components/StatusBadge'
import SymbolTooltip from '../components/SymbolTooltip'

interface Trade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  filled_qty: number
  filled_avg_price: number | null
  order_type: string
  status: string
  submitted_at: string
  filled_at: string | null
}

const PAGE_SIZE = 20

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function TradeHistory() {
  const { data, loading, error, lastUpdated } = usePoll<Trade[]>('/api/trades', 120_000)
  const [symbolFilter, setSymbolFilter] = useState<string>('all')
  const [sideFilter, setSideFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const trades = data ?? []

  const uniqueSymbols = Array.from(new Set(trades.map((t) => t.symbol))).sort()

  const filtered = trades.filter((t) => {
    if (symbolFilter !== 'all' && t.symbol !== symbolFilter) return false
    if (sideFilter !== 'all' && t.side !== sideFilter) return false
    return true
  })

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Trade History</h1>
          <p className="text-sm text-gray-500 mt-1">All executed orders — newest first</p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-600">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
          Unable to load trade history: {error}. Retrying every 120s.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={symbolFilter}
          onChange={(e) => { setSymbolFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-gray-500"
        >
          <option value="all">All symbols</option>
          {uniqueSymbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={sideFilter}
          onChange={(e) => { setSideFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-gray-500"
        >
          <option value="all">All sides</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        {!loading && (
          <span className="text-xs text-gray-600 ml-auto">
            {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Trade table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
        {loading ? (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-2">Submitted</th>
                <th className="text-left px-4 py-2">Symbol</th>
                <th className="text-left px-4 py-2">Side</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-right px-4 py-2">Filled Qty</th>
                <th className="text-right px-4 py-2">Fill Price</th>
                <th className="text-right px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        ) : visible.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">No trades found</p>
            <p className="text-xs text-gray-600 mt-1">
              {trades.length === 0
                ? 'Executed orders will appear here once the trading algorithm is active'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left px-4 py-2">Submitted</th>
                  <th className="text-left px-4 py-2">Symbol</th>
                  <th className="text-left px-4 py-2">Side</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Filled Qty</th>
                  <th className="text-right px-4 py-2">Fill Price</th>
                  <th className="text-right px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(t.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3"><SymbolTooltip symbol={t.symbol} className="font-medium text-gray-100" /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        t.side === 'buy'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}>
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-300">{t.qty}</td>
                    <td className="text-right px-4 py-3 text-gray-300">{t.filled_qty}</td>
                    <td className="text-right px-4 py-3 text-gray-300">
                      {t.filled_avg_price != null ? `$${t.filled_avg_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="text-right px-4 py-3">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="px-4 py-3 border-t border-gray-800 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Load more ({filtered.length - visible.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Wash sale notice */}
      <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg px-4 py-3 text-sm text-yellow-400">
        <strong>Wash Sale Tracking:</strong> Positions sold at a loss are automatically monitored
        for 30-day re-purchase windows (IRC §1091). Flagged trades will be highlighted in red.
        Mark-to-market election (§475f) under consideration — see AII-9.
      </div>
    </div>
  )
}
