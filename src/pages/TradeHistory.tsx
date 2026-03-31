// Placeholder — will be populated from brokerage API (AII-10)
const PLACEHOLDER_TRADES: {
  id: string
  date: string
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  price: number
  total: number
  status: string
}[] = []

export default function TradeHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Trade History</h1>
        <p className="text-sm text-gray-500 mt-1">All executed orders — newest first</p>
      </div>

      {/* Filters (placeholder UI) */}
      <div className="flex gap-3 items-center">
        <select
          disabled
          className="bg-gray-900 border border-gray-700 text-gray-500 text-sm rounded px-3 py-1.5 cursor-not-allowed"
        >
          <option>All symbols</option>
        </select>
        <select
          disabled
          className="bg-gray-900 border border-gray-700 text-gray-500 text-sm rounded px-3 py-1.5 cursor-not-allowed"
        >
          <option>All sides</option>
        </select>
        <span className="text-xs text-gray-600 ml-auto">Filters active after AII-10 integration</span>
      </div>

      {/* Trade table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {PLACEHOLDER_TRADES.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">No trades yet</p>
            <p className="text-xs text-gray-600 mt-1">Executed orders will appear here once the trading algorithm is active</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Symbol</th>
                <th className="text-left px-4 py-2">Side</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-right px-4 py-2">Price</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-right px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_TRADES.map((t) => (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 text-xs">{t.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-100">{t.symbol}</td>
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
                  <td className="text-right px-4 py-3 text-gray-300">${t.price.toFixed(2)}</td>
                  <td className="text-right px-4 py-3 text-gray-300">${t.total.toFixed(2)}</td>
                  <td className="text-right px-4 py-3">
                    <span className="text-xs text-gray-500">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Wash sale notice */}
      <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg px-4 py-3 text-xs text-yellow-500/80">
        <strong>Wash Sale Tracking:</strong> Positions sold at a loss are automatically monitored
        for 30-day re-purchase windows (IRC §1091). Flagged trades will be highlighted in red.
        Mark-to-market election (§475f) under consideration — see AII-9.
      </div>
    </div>
  )
}
