interface Trade {
  ticker: string
  action: 'BUY' | 'SELL'
  sector?: string
  momentumScore?: number
  entryPrice?: number
  stopLoss?: number
  positionSize?: number
  portfolioPct?: number
  rationale?: string
}

export default function TradeCard({ trade }: { trade: Trade }) {
  const isBuy = trade.action === 'BUY'
  return (
    <div className={`my-4 rounded-lg border p-4 ${isBuy ? 'border-green-800/50 bg-green-950/20' : 'border-red-800/50 bg-red-950/20'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-100">{trade.ticker}</span>
          {trade.sector && <span className="text-xs text-gray-500">{trade.sector}</span>}
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded ${isBuy ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'}`}>
          {trade.action}
        </span>
      </div>
      {trade.momentumScore !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Momentum Score</span>
            <span className={trade.momentumScore >= 0 ? 'text-green-400' : 'text-red-400'}>
              {trade.momentumScore.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${trade.momentumScore >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.abs(trade.momentumScore) * 3, 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {trade.entryPrice !== undefined && (
          <div><p className="text-xs text-gray-500">Entry</p><p className="text-sm text-gray-200">${trade.entryPrice.toFixed(2)}</p></div>
        )}
        {trade.stopLoss !== undefined && (
          <div><p className="text-xs text-gray-500">Stop Loss</p><p className="text-sm text-red-400">${trade.stopLoss.toFixed(2)}</p></div>
        )}
        {trade.positionSize !== undefined && (
          <div><p className="text-xs text-gray-500">Size</p><p className="text-sm text-gray-200">${trade.positionSize.toLocaleString()}</p></div>
        )}
        {trade.portfolioPct !== undefined && (
          <div><p className="text-xs text-gray-500">% Portfolio</p><p className="text-sm text-gray-200">{trade.portfolioPct.toFixed(1)}%</p></div>
        )}
      </div>
      {trade.rationale && (
        <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-800 pt-2">{trade.rationale}</p>
      )}
    </div>
  )
}
