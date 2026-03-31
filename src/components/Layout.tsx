import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { usePoll } from '../hooks/usePoll'
import ActivityFeed from './ActivityFeed'

interface NavItem {
  to: string
  label: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Portfolio',
    items: [
      { to: '/overview', label: 'Overview' },
      { to: '/trades', label: 'Trades' },
      { to: '/market', label: 'Market' },
    ],
  },
  {
    label: 'Company',
    items: [
      { to: '/org', label: 'Org Chart' },
      { to: '/tickets', label: 'Tickets' },
      { to: '/messages', label: 'Messages' },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { to: '/research', label: 'Research' },
      { to: '/blog', label: 'Blog' },
      { to: '/search', label: 'Search' },
    ],
  },
  {
    label: 'Info',
    items: [
      { to: '/about', label: 'About' },
    ],
  },
]

interface ApiStatus {
  connected: boolean
  account_number?: string
  status?: string
}

export default function Layout() {
  const [activityOpen, setActivityOpen] = useState(false)
  const { data, error } = usePoll<ApiStatus>('/api/status', 30_000)
  const connected = !!data?.connected && !error
  const statusLabel = error ? 'Offline' : data ? (connected ? 'Live' : 'Error') : 'Connecting…'

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-green-400 font-bold text-lg">AI-Investiture</span>
            <span className="text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">$500 Portfolio</span>
          </div>

          {/* Nav groups */}
          <nav className="flex items-center gap-4 overflow-x-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="flex items-center gap-0.5">
                <span className="text-xs text-gray-600 mr-1 hidden lg:inline">{group.label}</span>
                {group.items.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `px-2.5 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-green-900/40 text-green-400'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Connection status */}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
              connected ? 'bg-green-400' : error ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`} />
            <span className="text-xs text-gray-500">{statusLabel}</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Activity Feed Drawer */}
      <div className="border-t border-gray-800 bg-gray-900/50">
        <button
          onClick={() => setActivityOpen(o => !o)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${activityOpen ? 'bg-green-400' : 'bg-gray-600'}`} />
            Agent Activity Feed
          </span>
          <span>{activityOpen ? '▼' : '▲'}</span>
        </button>
        {activityOpen && (
          <div className="h-48 border-t border-gray-800">
            <ActivityFeed />
          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 py-3 text-center text-xs text-gray-600">
        AI-Investiture · Genkins Forge LLC · Not financial advice ·
        Powered by <a href="https://knowledgenexus.ai" className="text-gray-500 hover:text-gray-400">Knowledge Nexus</a>
        {' '}+{' '}
        <a href="https://knowledgenexus.ai" className="text-gray-500 hover:text-gray-400">Paperclip</a>
      </footer>
    </div>
  )
}
