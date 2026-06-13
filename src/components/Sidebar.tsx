import { NavLink } from 'react-router-dom'
import { GridIcon, UsersIcon, FlowIcon, ListIcon } from './icons'
import { ShieldIcon as Brand } from './icons'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { path: '/accounts', label: 'Account Inventory', icon: UsersIcon },
  { path: '/workflows', label: 'Workflows', icon: FlowIcon },
  { path: '/audit', label: 'Audit Log', icon: ListIcon },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      {/* brand */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-on shadow-sm">
          <Brand width={22} height={22} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-strong">PAG</p>
          <p className="text-[11px] text-subtle">Privileged Access Governance</p>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">
          Overview
        </p>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-on shadow-sm'
                  : 'text-muted hover:bg-surface-hover hover:text-strong'
              }`
            }
          >
            <Icon width={18} height={18} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* footer */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft/50 text-xs font-bold text-accent dark:bg-accent/20">
            AM
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-strong">alice.manager</p>
            <p className="truncate text-[11px] text-subtle">Access Reviewer</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
