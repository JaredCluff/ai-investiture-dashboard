import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/overview', label: 'Overview', icon: '📊' },
  { to: '/trades', label: 'Trade History', icon: '📋' },
  { to: '/market', label: 'Market View', icon: '📈' },
  { to: '/about', label: 'About', icon: 'ℹ️' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14">
          <div className="flex items-center gap-2 mr-8">
            <span className="text-green-400 font-bold text-lg">AI-Investiture</span>
            <span className="text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">$500 Portfolio</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-green-900/40 text-green-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <span>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Last updated:</span>
            <span className="text-xs text-gray-400">–</span>
            <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block"></span>
              No data
            </span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800 py-3 text-center text-xs text-gray-600">
        AI-Investiture · Genkins Forge LLC · Not financial advice
      </footer>
    </div>
  )
}
