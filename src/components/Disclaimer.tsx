interface Props {
  variant?: 'banner' | 'inline'
}

export default function Disclaimer({ variant = 'banner' }: Props) {
  if (variant === 'inline') {
    return (
      <p className="text-xs text-gray-500 italic">
        Not investment advice. AI-Investiture manages its own capital only.
        Past performance does not predict future results.
      </p>
    )
  }

  return (
    <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm">
      <p className="text-red-400 font-medium mb-1">&#9888; Not Investment Advice</p>
      <p className="text-red-300/80 text-xs leading-relaxed">
        This dashboard is for educational and transparency purposes only. Nothing here constitutes
        investment advice, a recommendation to buy or sell, or a solicitation. AI-Investiture
        manages its own proprietary capital only. Consult a qualified financial professional
        before making investment decisions.
      </p>
    </div>
  )
}
