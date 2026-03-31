export default function About() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">About AI-Investiture</h1>
        <p className="text-sm text-gray-500 mt-1">What this is and what it isn't</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4 text-sm text-gray-300">
        <h2 className="text-base font-medium text-gray-100">What is AI-Investiture?</h2>
        <p>
          AI-Investiture is an experimental project by{' '}
          <a href="https://knowledgenexus.ai" className="text-green-400 hover:underline">Genkins Forge LLC</a>{' '}
          that uses AI agents to manage a small, real-money investment portfolio of $500.
          This dashboard provides transparent, public visibility into the portfolio's performance,
          holdings, and trading activity.
        </p>
        <p>
          The project is purely educational and demonstrative. It explores how autonomous AI
          systems can make and execute investment decisions, track compliance constraints, and
          report results in real time.
        </p>
      </div>

      <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-5 space-y-3 text-sm">
        <h2 className="text-base font-medium text-red-400">⚠ Legal Disclaimer</h2>
        <p className="text-red-300/80">
          <strong>This is not financial advice.</strong> Nothing on this dashboard constitutes
          investment advice, a recommendation to buy or sell any security, or a solicitation of
          any investment. Past performance of this portfolio does not predict future results.
        </p>
        <p className="text-red-300/80">
          AI-Investiture is managing its own proprietary capital. It is not an investment adviser,
          broker-dealer, or registered fund. It does not manage money on behalf of any other person
          or entity.
        </p>
        <p className="text-red-300/80">
          This dashboard is provided for transparency and educational purposes only. Viewers
          should conduct their own research and consult a qualified financial professional before
          making any investment decisions.
        </p>
        <p className="text-red-300/60 text-xs">
          Research basis: AII-9 regulatory analysis (2026-03-30). No SEC/RIA registration is
          required for self-managed proprietary capital under the Investment Advisers Act of 1940.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3 text-sm text-gray-300">
        <h2 className="text-base font-medium text-gray-100">Compliance Notes</h2>
        <ul className="space-y-2 text-gray-400">
          <li className="flex gap-2">
            <span className="text-green-400 shrink-0">✓</span>
            <span>Self-directed proprietary portfolio — no RIA registration required</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 shrink-0">⚠</span>
            <span>Pattern Day Trader rules apply — max 3 day trades per rolling 5-day window with &lt;$25k margin account. Using swing/position trading strategy.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 shrink-0">⚠</span>
            <span>Wash sale rule (IRC §1091) monitored — algorithm avoids re-buying positions within 30 days of a loss sale.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 shrink-0">✓</span>
            <span>Brokerage API compliance handled by broker (Alpaca or equivalent)</span>
          </li>
        </ul>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-sm text-gray-400">
        <h2 className="text-sm font-medium text-gray-300 mb-2">Built With</h2>
        <ul className="space-y-1 text-xs text-gray-500">
          <li>React + Vite + TypeScript</li>
          <li>Tailwind CSS</li>
          <li>nginx / Podman — served via Cloudflare Tunnel</li>
          <li>Brokerage API: TBD (AII-10)</li>
          <li>Market data: TBD (AII-14)</li>
        </ul>
      </div>
    </div>
  )
}
