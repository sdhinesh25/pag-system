// Page: Account Inventory (/accounts) — backed by Supabase.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Account, RiskLevel } from '../types'
import { getAccounts } from '../api/accounts'
import ApiError from '../components/ApiError'
import { Card, PageSkeleton, RiskPill, PamPill, CertPill, OverdueTag } from '../components/ui'
import { ChevronDown, ChevronRight, SearchIcon } from '../components/icons'

export default function AccountInventory() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [privFilter, setPrivFilter] = useState<'all' | 'privileged' | 'standard'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const types = useMemo(() => Array.from(new Set(accounts.map((a) => a.accountType))), [accounts])
  // Read-only Standard Users aren't privileged — matches the Dashboard's split.
  const privilegedCount = useMemo(() => accounts.filter((a) => a.accountType !== 'Standard User').length, [accounts])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accounts.filter(
      (a) =>
        (riskFilter === 'all' || a.riskLevel === riskFilter) &&
        (typeFilter === 'all' || a.accountType === typeFilter) &&
        (privFilter === 'all' || (privFilter === 'privileged' ? a.accountType !== 'Standard User' : a.accountType === 'Standard User')) &&
        (q === '' || a.username.toLowerCase().includes(q) || (a.owner ?? '').toLowerCase().includes(q) || a.server.toLowerCase().includes(q)),
    )
  }, [accounts, riskFilter, typeFilter, privFilter, search])

  if (loading) return <PageSkeleton />
  if (error) return <ApiError message={error} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strong">Account Inventory</h1>
        <p className="mt-1 text-sm text-muted">
          Showing <span className="font-semibold text-strong">{filtered.length}</span> of {accounts.length} accounts
          <span className="text-subtle"> · {privilegedCount} privileged</span>
        </p>
      </div>

      {/* toolbar: search + filters */}
      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, owner or server…"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-strong placeholder:text-subtle transition-colors hover:bg-surface-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select label="Privilege" value={privFilter} onChange={(v) => setPrivFilter(v as 'all' | 'privileged' | 'standard')} options={['all', 'privileged', 'standard']} />
          <Select label="Risk" value={riskFilter} onChange={(v) => setRiskFilter(v as RiskLevel | 'all')} options={['all', 'critical', 'high', 'medium', 'low']} />
          <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={['all', ...types]} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-elevated text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <Th>Account</Th>
                <Th>Type &amp; Source</Th>
                <Th>Last Login</Th>
                <Th>Review</Th>
                <Th>Risk</Th>
                <Th>PAM</Th>
                <Th>Certification</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((a) => (
                <tr key={a.id} className={`group ${rowClass(a)}`}>
                  <td className="px-4 py-3">
                    <Link to={`/accounts/${a.id}`} className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatarTone(a)}`}>
                        {initials(a.username)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono font-medium text-strong group-hover:text-accent">{a.username}</span>
                        <span className="block truncate text-xs text-subtle">
                          {a.owner ? `Owner: ${a.owner}` : <span className="font-medium text-amber-500">⚠ Unassigned owner</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-strong">{a.accountType}</span>
                    <span className="block text-xs text-subtle">{a.server} · {a.sourceSystem}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{a.lastLogin}</td>
                  <td className="px-4 py-3">
                    {a.isOverdue ? <OverdueTag /> : <span className="text-xs text-subtle">due {a.reviewDue}</span>}
                  </td>
                  <td className="px-4 py-3"><RiskPill level={a.riskLevel} /></td>
                  <td className="px-4 py-3"><PamPill status={a.pamStatus} /></td>
                  <td className="px-4 py-3"><CertPill value={a.certification} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/accounts/${a.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-accent/10 hover:text-accent" aria-label="View details">
                      <ChevronRight width={16} height={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-subtle">No accounts match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="flex flex-wrap gap-4 text-xs text-subtle">
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-red-500/15 align-middle ring-1 ring-red-500/40" /> Orphaned account</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-amber-500/15 align-middle ring-1 ring-amber-500/40" /> Review overdue (&gt; 180 days)</span>
      </p>
    </div>
  )
}

function initials(username: string): string {
  const part = username.split('\\').pop() ?? username
  return part.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'AC'
}

// Avatar tint echoes the row's severity so the eye lands on risky accounts first.
function avatarTone(a: Account): string {
  if (a.isOrphaned || a.ownerTerminated) return 'bg-red-500/15 text-red-500'
  if (a.riskLevel === 'critical' || a.riskLevel === 'high') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-accent/10 text-accent'
}

// Red wins over amber: an orphaned account is the more severe flag.
function rowClass(a: Account): string {
  if (a.isOrphaned) return 'bg-red-500/[0.05] hover:bg-red-500/[0.09] transition-colors'
  if (a.daysSinceReview > 180) return 'bg-amber-500/[0.05] hover:bg-amber-500/[0.09] transition-colors'
  return 'transition-colors hover:bg-surface-hover'
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
      {label}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface pl-3 pr-9 text-sm font-medium normal-case tracking-normal text-strong transition-colors hover:bg-surface-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {options.map((o) => <option key={o} value={o}>{o === 'all' ? 'All' : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
        </select>
        <ChevronDown width={16} height={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </label>
  )
}
