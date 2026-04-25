import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { usePoll } from '../hooks/usePoll'
import ActivityFeed from './ActivityFeed'
import ChatWidget from './ChatWidget'

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
      { to: '/status', label: 'Status' },
      { to: '/marketing', label: 'Marketing' },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { data, error } = usePoll<ApiStatus>('/api/status', 30_000)
  const connected = !!data?.connected && !error
  const statusLabel = error ? 'Offline' : data ? (connected ? 'Live' : 'Error') : 'Connecting…'

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-4">
          {/* Brand */}
          <NavLink
            to="/overview"
            className="flex items-center gap-2 shrink-0 group"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="w-7 h-7 rounded-md bg-green-900/60 border border-green-700/40 flex items-center justify-center text-green-400 font-bold text-sm group-hover:bg-green-900/80 transition-colors">
              Ai
            </span>
            <span className="text-green-400 font-bold text-lg hidden sm:inline">AI-Investiture</span>
            <span className="text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 hidden md:inline">$500 Portfolio</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 overflow-x-auto flex-1">
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

          {/* Right side: status + hamburger */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                connected ? 'bg-green-400' : error ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`} />
              <span className="text-xs text-gray-500 hidden sm:inline">{statusLabel}</span>
            </div>
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              className="md:hidden p-2.5 -mr-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <nav className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-4 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-medium">{group.label}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {group.items.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `py-2.5 rounded text-sm text-center transition-colors ${
                          isActive
                            ? 'bg-green-900/40 text-green-400'
                            : 'text-gray-400 bg-gray-800/50 hover:text-gray-200 hover:bg-gray-800'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Activity Feed Drawer */}
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <button
          onClick={() => setActivityOpen(o => !o)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${activityOpen ? 'bg-green-400' : 'bg-gray-600'} transition-colors`} />
            <span className="font-medium">Agent Activity</span>
          </span>
          <span className={`transition-transform ${activityOpen ? 'rotate-180' : ''}`}>&#9650;</span>
        </button>
        {activityOpen && (
          <div className="h-48 border-t border-gray-800 overflow-y-auto">
            <ActivityFeed />
          </div>
        )}
      </div>

      <ChatWidget />

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600 space-y-1">
        <div>
          AI-Investiture · <a href="https://knowledgenexus.ai" className="text-gray-500 hover:text-gray-400" target="_blank" rel="noopener noreferrer">Genkins Forge LLC</a> · Not financial advice
        </div>
        <div className="flex items-center justify-center gap-3 text-gray-700">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-800 inline-block" />
            <a href="https://knowledgenexus.ai" className="text-gray-500 hover:text-gray-400" target="_blank" rel="noopener noreferrer">Knowledge Nexus</a>
          </span>
          <span className="text-gray-800">+</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-800 inline-block" />
            <span className="text-gray-500">Paperclip</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
