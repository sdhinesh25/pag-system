// Sticky top bar: route-aware breadcrumb + theme toggle + user.
import { useLocation } from 'react-router-dom'
import { ChevronRight } from './icons'
import { ThemeToggle } from './ui'

function titleFor(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/accounts/')) return 'Account Detail'
  if (pathname.startsWith('/accounts')) return 'Account Inventory'
  if (pathname.startsWith('/workflows')) return 'Workflows'
  if (pathname.startsWith('/audit')) return 'Audit Log'
  return 'Dashboard'
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = titleFor(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-subtle">Privileged Access</span>
        <ChevronRight width={14} height={14} className="text-subtle" />
        <span className="font-semibold text-strong">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-on">
          AM
        </span>
      </div>
    </header>
  )
}
