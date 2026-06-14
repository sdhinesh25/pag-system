import { NavLink, useNavigate } from 'react-router-dom'
import { GridIcon, UsersIcon, FlowIcon, ListIcon } from './icons'
import { ShieldIcon as Brand } from './icons'
import { useAuth } from '../auth/AuthProvider'

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
      <SidebarUser />
    </aside>
  )
}

function SidebarUser() {
  const { user, actor, signOut } = useAuth()
  const navigate = useNavigate()
  const initials = actor.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'PA'

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft/50 text-xs font-bold text-accent dark:bg-accent/20">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-strong">{actor}</p>
          <p className="truncate text-[11px] text-subtle">{user?.email ?? 'Access Reviewer'}</p>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-hover hover:text-red-500"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
