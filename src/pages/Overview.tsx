// Placeholder data — will be replaced with live brokerage API data
const PLACEHOLDER_HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple Inc.', shares: 0, value: 0, costBasis: 0, pnl: 0, pnlPct: 0 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', shares: 0, value: 0, costBasis: 0, pnl: 0, pnlPct: 0 },
]

const PLACEHOLDER_STATS = {
  totalValue: 500.0,
  totalCost: 500.0,
  totalPnl: 0.0,
  totalPnlPct: 0.0,
  cash: 500.0,
  pdtTradesUsed: 0,
  pdtTradesAllowed: 3,
  washSaleRisk: 0,
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'green' | 'red' | 'yellow' | 'blue' }) {
  const accentClass = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  }[accent ?? 'blue'] ?? 'text-gray-100'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Overview() {
  const s = PLACEHOLDER_STATS

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Portfolio Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time holdings, P&amp;L, and compliance metrics</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Value" value={`$${s.totalValue.toFixed(2)}`} accent="blue" />
        <StatCard label="Cash Available" value={`$${s.cash.toFixed(2)}`} accent="green" />
        <StatCard
          label="Total P&L"
          value={`${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(2)}`}
          sub={`${s.totalPnlPct >= 0 ? '+' : ''}${s.totalPnlPct.toFixed(2)}%`}
          accent={s.totalPnl >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="PDT Trades Used"
          value={`${s.pdtTradesUsed} / ${s.pdtTradesAllowed}`}
          sub="per rolling 5-day window"
          accent={s.pdtTradesUsed >= s.pdtTradesAllowed ? 'red' : 'yellow'}
        />
      </div>

      {/* Wash sale tracker */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-300">Wash Sale Watch</h2>
          <span className="text-xs text-gray-500">IRC §1091 — 30-day lookback</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm text-gray-400">
            {s.washSaleRisk === 0
              ? 'No wash sale risk detected'
              : `${s.washSaleRisk} potential wash sale(s) flagged`}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Positions sold at a loss will be monitored for 30 days. Re-buying the same security within
          that window disallows the loss deduction.
        </p>
      </div>

      {/* Holdings table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">Holdings</h2>
        </div>
        {PLACEHOLDER_HOLDINGS.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            No open positions — cash only
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-2">Symbol</th>
                <th className="text-right px-4 py-2">Shares</th>
                <th className="text-right px-4 py-2">Market Value</th>
                <th className="text-right px-4 py-2">Cost Basis</th>
                <th className="text-right px-4 py-2">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_HOLDINGS.map((h) => (
                <tr key={h.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-100">{h.symbol}</span>
                    <span className="ml-2 text-xs text-gray-500">{h.name}</span>
                  </td>
                  <td className="text-right px-4 py-3 text-gray-300">{h.shares}</td>
                  <td className="text-right px-4 py-3 text-gray-300">${h.value.toFixed(2)}</td>
                  <td className="text-right px-4 py-3 text-gray-300">${h.costBasis.toFixed(2)}</td>
                  <td className={`text-right px-4 py-3 ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                    <span className="ml-1 text-xs">({h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-800">
          Placeholder data — live brokerage integration pending (AII-10)
        </div>
      </div>
    </div>
  )
}
