import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/accounts', label: 'Account Inventory' },
  { path: '/reviews', label: 'Access Review' },
  { path: '/audit', label: 'Audit Log' },
  { path: '/compliance', label: 'Compliance Summary' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-5 py-6 border-b border-gray-800">
        <h1 className="text-lg font-semibold tracking-tight">PAG</h1>
        <p className="text-xs text-gray-400 mt-1">Privilege Access Governance</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
