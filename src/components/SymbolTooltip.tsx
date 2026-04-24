import { getCompanyName } from '../lib/companyNames'

interface SymbolTooltipProps {
  symbol: string
  className?: string
}

/**
 * Renders a stock ticker symbol with an on-hover tooltip showing the full company name.
 * If the symbol is not in the company name mapping, the symbol renders without a tooltip.
 */
export default function SymbolTooltip({ symbol, className }: SymbolTooltipProps) {
  const name = getCompanyName(symbol)

  if (!name) {
    return <span className={className}>{symbol}</span>
  }

  return (
    <span className="relative group inline-block">
      <span className={className}>{symbol}</span>
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-gray-100 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-lg"
        role="tooltip"
      >
        {name}
      </span>
    </span>
  )
}
