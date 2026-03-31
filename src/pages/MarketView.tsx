// Placeholder — will integrate with market data API (AII-14)
const WATCHLIST = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'BRK.B', 'VTI']

function WatchlistRow({ symbol }: { symbol: string }) {
  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30">
      <td className="px-4 py-3 font-medium text-gray-100">{symbol}</td>
      <td className="text-right px-4 py-3 text-gray-500 text-sm">–</td>
      <td className="text-right px-4 py-3 text-gray-500 text-sm">–</td>
      <td className="text-right px-4 py-3 text-gray-500 text-sm">–</td>
      <td className="text-right px-4 py-3 text-gray-500 text-sm">–</td>
    </tr>
  )
}

export default function MarketView() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Market View</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time quotes and charts — powered by market data API (pending AII-14)</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 border border-gray-700 rounded px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block"></span>
          Data feed offline
        </span>
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Price Chart</span>
          <div className="flex gap-1">
            {['1D', '5D', '1M', '3M', '1Y'].map((range) => (
              <button
                key={range}
                disabled
                className="text-xs px-2 py-1 rounded text-gray-600 cursor-not-allowed"
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-600 text-sm">
          Chart will render here (TradingView Lightweight Charts or similar — pending AII-14 &amp; AII-15 research)
        </div>
      </div>

      {/* Watchlist */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">Watchlist</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800">
              <th className="text-left px-4 py-2">Symbol</th>
              <th className="text-right px-4 py-2">Last</th>
              <th className="text-right px-4 py-2">Change</th>
              <th className="text-right px-4 py-2">Change %</th>
              <th className="text-right px-4 py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {WATCHLIST.map((s) => (
              <WatchlistRow key={s} symbol={s} />
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-800">
          Live quotes pending — evaluating Alpha Vantage, Polygon.io, Finnhub (AII-14)
        </div>
      </div>
    </div>
  )
}
