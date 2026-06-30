// Privileged Access Governance — Dashboard (/dashboard)
// Every number is computed from the live `accounts` table (Supabase).
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Account, RiskLevel } from '../types'
import { getAccounts } from '../api/accounts'
import Donut, { type DonutSegment } from '../components/Donut'
import BarChart, { type BarItem } from '../components/BarChart'
import ApiError from '../components/ApiError'
import { Card, PageSkeleton, RiskPill, PamPill } from '../components/ui'
import { ChevronDown, ChevronLeft, ChevronRight, FilterIcon, SearchIcon } from '../components/icons'

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#22c55e',
}
const PAM_COLORS = {
  Onboarded: '#22c55e',
  'Pending Onboarding': '#f59e0b',
  'Not Onboarded': '#ef4444',
} as const
const TYPE_COLORS: Record<string, string> = {
  'Domain Admin': '#8b5cf6',
  'Linux Sudo': '#f59e0b',
  'Enterprise Admin': '#22c55e',
  'Shared Account': '#3b82f6',
  'Emergency/Break-Glass': '#6366f1',
  'Service Account': '#06b6d4',
  'Standard User': '#64748b',
}
const ALL = '__ALL__'

// Standard users are read-only — everything else carries elevated (privileged) access.
const NON_PRIVILEGED_TYPES = new Set(['Standard User'])
function isPrivileged(a: Account): boolean {
  return !NON_PRIVILEGED_TYPES.has(a.accountType)
}

const INVENTORY_BUCKETS: {
  label: string
  description: string
  color: string
  match: (t: string) => boolean
}[] = [
  { label: 'Domain Accounts', description: 'AD domain / enterprise admin accounts', color: '#3b82f6', match: (t) => t === 'Domain Admin' || t === 'Enterprise Admin' },
  { label: 'Sudo Accounts', description: 'Linux sudo / command grants', color: '#f59e0b', match: (t) => t === 'Linux Sudo' },
  { label: 'Shared Accounts', description: 'Shared / generic accounts', color: '#eab308', match: (t) => t === 'Shared Account' },
  { label: 'Break-Glass Accounts', description: 'Emergency break-glass accounts', color: '#ef4444', match: (t) => t === 'Emergency/Break-Glass' },
  { label: 'Service Accounts', description: 'Automation / service identities', color: '#06b6d4', match: (t) => t === 'Service Account' },
  { label: 'Standard Users', description: 'Read-only / non-privileged accounts', color: '#64748b', match: (t) => t === 'Standard User' },
]

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pendingSource, setPendingSource] = useState(ALL)
  const [pendingResource, setPendingResource] = useState(ALL)
  const [source, setSource] = useState(ALL)
  const [resource, setResource] = useState(ALL)

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const sources = useMemo(() => Array.from(new Set(accounts.map((a) => a.sourceSystem))), [accounts])
  const resources = useMemo(() => Array.from(new Set(accounts.map((a) => a.server))), [accounts])

  const scoped = useMemo(
    () =>
      accounts.filter(
        (a) =>
          (source === ALL || a.sourceSystem === source) &&
          (resource === ALL || a.server === resource),
      ),
    [accounts, source, resource],
  )

  if (loading) return <PageSkeleton />
  if (error) return <ApiError message={error} />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strong">Privileged Access Governance</h1>
        {(() => {
          const overdue = scoped.filter((a) => a.isOverdue).length
          return overdue > 0 ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              ⏰ {overdue} account{overdue === 1 ? '' : 's'} overdue for review
            </div>
          ) : null
        })()}
      </div>

      {/* global filter bar */}
      <Card className="flex flex-wrap items-end gap-3 p-4 sm:gap-4">
        <Field label="Source System">
          <Select value={pendingSource} onChange={setPendingSource} options={[{ value: ALL, label: 'All systems' }, ...sources.map((s) => ({ value: s, label: s }))]} />
        </Field>
        <Field label="Resources">
          <Select value={pendingResource} onChange={setPendingResource} options={[{ value: ALL, label: 'All servers' }, ...resources.map((s) => ({ value: s, label: s }))]} />
        </Field>
        <button
          onClick={() => {
            setSource(pendingSource)
            setResource(pendingResource)
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-on shadow-sm transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <FilterIcon width={16} height={16} />
          Filter
        </button>
        <button
          onClick={() => {
            setPendingSource(ALL)
            setPendingResource(ALL)
            setSource(ALL)
            setResource(ALL)
          }}
          className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-strong focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          Clear
        </button>
      </Card>

      <InventoryBreakdownCard accounts={scoped} />
      <PrivilegedBreakdownCard accounts={scoped} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RiskChartCard accounts={scoped} />
        <PamChartCard accounts={scoped} />
        <TypeChartCard accounts={scoped} />
      </div>

      <InventoryTable accounts={scoped} />
    </div>
  )
}

/* ---------- Account Inventory Breakdown ---------- */
function InventoryBreakdownCard({ accounts }: { accounts: Account[] }) {
  const total = accounts.length
  const rows = INVENTORY_BUCKETS.map((b) => ({ bucket: b, count: accounts.filter((a) => b.match(a.accountType)).length })).filter((r) => r.count > 0)
  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
        <KpiTile accent="from-amber-500/25" value={String(total)} title="Total Accounts" subtitle="all accounts scanned" footer={`${rows.length} account types`} footerColor="text-amber-500" />
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-strong">Account Inventory Breakdown</h3>
            <Pill>Total: {total} Accounts</Pill>
          </div>
          <BreakdownTable
            head={['ACCOUNT TYPE', 'DESCRIPTION', 'ACCOUNTS', '% OF TOTAL', 'VISUAL BREAKDOWN']}
            rows={rows.map((r) => ({ key: r.bucket.label, color: r.bucket.color, cells: [r.bucket.label, r.bucket.description, String(r.count), `${pct(r.count, total)}%`], barPct: total ? (r.count / total) * 100 : 0 }))}
            totals={['Total', '', String(total), '100%']}
          />
        </div>
      </div>
    </Card>
  )
}

/* ---------- Privileged Account Breakdown ---------- */
function PrivilegedBreakdownCard({ accounts }: { accounts: Account[] }) {
  const total = accounts.length
  const priv = accounts.filter(isPrivileged)
  const types = Array.from(new Set(priv.map((a) => a.accountType)))
  const rows = types
    .map((type) => {
      const inType = priv.filter((a) => a.accountType === type)
      return { type, count: inType.length, covered: inType.filter((a) => a.pamStatus === 'Onboarded').length }
    })
    .sort((a, b) => b.count - a.count)

  const totalPriv = priv.length
  const totalCovered = priv.filter((a) => a.pamStatus === 'Onboarded').length
  const coverage = pct(totalCovered, totalPriv)

  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
        <KpiTile accent="from-accent/25" value={String(totalPriv)} title="Privileged Accounts" subtitle={`of ${total} total · ${pct(totalPriv, total)}% privileged`} footer={`${coverage}% PAM coverage`} footerColor="text-accent" />
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-strong">Privileged Account Breakdown</h3>
            <Pill>Total Privileged: {totalPriv} Accounts</Pill>
            <Pill tone="success">PAM Coverage: {totalCovered} of {totalPriv} ({coverage}%)</Pill>
          </div>
          <BreakdownTable
            head={['ACCOUNT TYPE', 'DESCRIPTION', 'PRIVILEGED ACCOUNTS', 'PAM COVERED', 'PAM COVERAGE', 'VISUAL BREAKDOWN']}
            rows={rows.map((r) => ({ key: r.type, color: TYPE_COLORS[r.type] ?? '#64748b', cells: [r.type, describeType(r.type), String(r.count), String(r.covered), `${pct(r.covered, r.count)}%`], barPct: r.count ? (r.covered / r.count) * 100 : 0 }))}
            totals={['Total', '', String(totalPriv), String(totalCovered), `${coverage}%`]}
          />
          <p className="mt-3 text-xs text-subtle">ⓘ PAM Coverage indicates privileged accounts onboarded to PAM.</p>
        </div>
      </div>
    </Card>
  )
}

/* ---------- chart cards ---------- */
function RiskChartCard({ accounts }: { accounts: Account[] }) {
  const order: RiskLevel[] = ['critical', 'high', 'medium', 'low']
  const segments: DonutSegment[] = order
    .map((r) => ({ label: cap(r), value: accounts.filter((a) => a.riskLevel === r).length, color: RISK_COLORS[r] }))
    .filter((s) => s.value > 0)
  return (
    <ChartPanel title="Accounts By Risk Level" legend={segments}>
      <Donut segments={segments} centerValue={String(accounts.length)} centerLabel="accounts" />
    </ChartPanel>
  )
}

function PamChartCard({ accounts }: { accounts: Account[] }) {
  const priv = accounts.filter(isPrivileged)
  const segments: DonutSegment[] = [
    { label: 'Vaulted', value: priv.filter((a) => a.pamStatus === 'Onboarded').length, color: PAM_COLORS.Onboarded },
    { label: 'Pending', value: priv.filter((a) => a.pamStatus === 'Pending Onboarding').length, color: PAM_COLORS['Pending Onboarding'] },
    { label: 'Not Vaulted', value: priv.filter((a) => a.pamStatus === 'Not Onboarded').length, color: PAM_COLORS['Not Onboarded'] },
  ].filter((s) => s.value > 0)
  const vaulted = priv.filter((a) => a.pamStatus === 'Onboarded').length
  return (
    <ChartPanel title="PAM Coverage" subtitle="Onboarded ÷ total privileged." legend={segments}>
      <Donut segments={segments} centerValue={`${pct(vaulted, priv.length)}%`} centerLabel="vaulted" />
    </ChartPanel>
  )
}

function TypeChartCard({ accounts }: { accounts: Account[] }) {
  const counts = new Map<string, number>()
  for (const a of accounts) counts.set(a.accountType, (counts.get(a.accountType) ?? 0) + 1)
  const items: BarItem[] = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, value]) => ({ label: type, value, color: TYPE_COLORS[type] ?? '#64748b' }))
  return (
    <ChartPanel title="Accounts By Type">
      <BarChart items={items} />
    </ChartPanel>
  )
}

/* ---------- Privileged Account Inventory table ---------- */
const PAGE_SIZE = 10

function InventoryTable({ accounts }: { accounts: Account[] }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [pamFilter, setPamFilter] = useState('all')
  const [reviewFilter, setReviewFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const types = useMemo(() => Array.from(new Set(accounts.map((a) => a.accountType))), [accounts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accounts.filter(
      (a) =>
        (typeFilter === 'all' || a.accountType === typeFilter) &&
        (riskFilter === 'all' || a.riskLevel === riskFilter) &&
        (pamFilter === 'all' || a.pamStatus === pamFilter) &&
        (reviewFilter === 'all' || a.certification === reviewFilter) &&
        (q === '' || a.username.toLowerCase().includes(q) || (a.owner ?? '').toLowerCase().includes(q) || a.server.toLowerCase().includes(q)),
    )
  }, [accounts, typeFilter, riskFilter, pamFilter, reviewFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  useEffect(() => setPage(1), [typeFilter, riskFilter, pamFilter, reviewFilter, search])

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-strong">Privileged Account Inventory</h2>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Account Type">
            <Select value={typeFilter} onChange={setTypeFilter} options={[{ value: 'all', label: 'All' }, ...types.map((t) => ({ value: t, label: t }))]} />
          </Field>
          <Field label="Risk">
            <Select value={riskFilter} onChange={setRiskFilter} options={[{ value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
          </Field>
          <Field label="PAM Status">
            <Select value={pamFilter} onChange={setPamFilter} options={[{ value: 'all', label: 'All' }, { value: 'Onboarded', label: 'Onboarded' }, { value: 'Pending Onboarding', label: 'Pending Onboarding' }, { value: 'Not Onboarded', label: 'Not Onboarded' }]} />
          </Field>
          <Field label="Review">
            <Select value={reviewFilter} onChange={setReviewFilter} options={[{ value: 'all', label: 'All' }, { value: 'Certified', label: 'Certified' }, { value: 'Not Certified', label: 'Not Certified' }, { value: 'Revoked', label: 'Revoked' }]} />
          </Field>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="border-b border-line p-3">
          <div className="relative max-w-xs">
            <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account, owner, server…"
              className="w-full rounded-lg border border-line-strong bg-canvas py-2 pl-9 pr-3 text-sm text-strong placeholder:text-subtle focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-elevated text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                {['Account', 'Type & Source', 'Server / App', 'Last Login', 'Risk', 'PAM', 'Details'].map((h, i, arr) => (
                  <th key={i} className={`whitespace-nowrap px-4 py-3 ${i === arr.length - 1 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => (
                <tr key={a.id} className="group transition-colors hover:bg-surface-hover">
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
                    <span className="block text-xs text-subtle">{a.sourceSystem}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{a.server}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(a.lastLogin)}</td>
                  <td className="px-4 py-3"><RiskPill level={a.riskLevel} /></td>
                  <td className="px-4 py-3"><PamPill status={a.pamStatus} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/accounts/${a.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-accent/10 hover:text-accent" aria-label="View details">
                      <ChevronRight width={16} height={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-subtle">No privileged accounts match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
          <span>
            Showing <span className="font-semibold text-strong">{filtered.length === 0 ? 0 : start + 1}</span> to{' '}
            <span className="font-semibold text-strong">{Math.min(start + PAGE_SIZE, filtered.length)}</span> of{' '}
            <span className="font-semibold text-strong">{filtered.length}</span> records
          </span>
          <div className="flex items-center gap-2">
            <PagerButton disabled={current <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft width={16} height={16} /></PagerButton>
            <span className="rounded-lg border border-line px-3 py-1 font-medium text-strong">{current}</span>
            <span>of {pageCount}</span>
            <PagerButton disabled={current >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}><ChevronRight width={16} height={16} /></PagerButton>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ---------- presentational helpers ---------- */
// Premium enterprise chart panel — fixed height, tight padding, subtle hover.
function ChartPanel({ title, subtitle, legend, children }: { title: string; subtitle?: string; legend?: DonutSegment[]; children: React.ReactNode }) {
  return (
    <div className="group flex h-[320px] flex-col overflow-hidden rounded-[14px] border border-black/[0.08] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.14] dark:border-white/[0.08] dark:bg-[#0B1220] dark:hover:border-white/[0.16]">
      {/* header — 16px 20px, fixed height so charts align across cards */}
      <div className="flex h-[56px] shrink-0 flex-col justify-center px-5">
        <h3 className="text-[16px] font-semibold leading-tight text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 truncate text-[12px] text-[#94A3B8]">{subtitle}</p>}
      </div>
      {/* legend row directly below header */}
      {legend && (
        <div className="h-[22px] shrink-0 px-5">
          <ChartLegend items={legend} />
        </div>
      )}
      {/* chart body fills the rest, vertically centered */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-3">{children}</div>
    </div>
  )
}

function ChartLegend({ items }: { items: DonutSegment[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-[#94A3B8]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

function KpiTile({ accent, value, title, subtitle, footer, footerColor }: { accent: string; value: string; title: string; subtitle: string; footer: string; footerColor: string }) {
  return (
    <div className={`flex flex-col justify-between rounded-xl border border-line bg-gradient-to-br ${accent} to-transparent p-4`}>
      <div>
        <div className="text-4xl font-bold text-strong">{value}</div>
        <div className="mt-1 text-sm font-medium text-muted">{title}</div>
        <div className="text-xs text-subtle">{subtitle}</div>
      </div>
      <div className={`mt-6 text-xs font-semibold ${footerColor}`}>{footer}</div>
    </div>
  )
}

interface BreakdownRow {
  key: string
  color: string
  cells: string[]
  barPct: number
}

function BreakdownTable({ head, rows, totals }: { head: string[]; rows: BreakdownRow[]; totals: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-subtle">
          <tr>
            {head.map((h) => <th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <td className="py-2.5 pr-4">
                <span className="flex items-center gap-2 font-medium text-strong">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.cells[0]}
                </span>
              </td>
              {r.cells.slice(1).map((c, i) => (
                <td key={i} className={`py-2.5 pr-4 ${i === 0 ? 'text-muted' : 'font-semibold'}`} style={i > 0 ? { color: r.color } : undefined}>{c}</td>
              ))}
              <td className="py-2.5">
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full" style={{ width: `${r.barPct}%`, backgroundColor: r.color }} />
                </div>
              </td>
            </tr>
          ))}
          <tr className="border-t border-line-strong">
            {totals.map((t, i) => <td key={i} className="py-2.5 pr-4 font-semibold text-strong">{t}</td>)}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-[170px] flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</span>
      {children}
    </label>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface pl-3.5 pr-9 text-sm font-medium text-strong shadow-sm transition-colors hover:border-line-strong/80 hover:bg-surface-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown width={16} height={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}

function Pill({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'success' }) {
  const tones = {
    accent: 'bg-accent-soft/40 text-accent dark:bg-accent/15',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

function PagerButton({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center rounded-lg border border-line px-2 py-1.5 text-muted transition-colors hover:bg-surface-hover disabled:opacity-40">
      {children}
    </button>
  )
}

/* ---------- utils ---------- */
function pct(n: number, total: number): string {
  if (!total) return '0'
  const v = (n / total) * 100
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '')
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}
function initials(username: string): string {
  const part = username.split('\\').pop() ?? username
  return part.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'AC'
}
// Avatar tint echoes severity so the eye lands on risky accounts first.
function avatarTone(a: Account): string {
  if (a.isOrphaned || a.ownerTerminated) return 'bg-red-500/15 text-red-500'
  if (a.riskLevel === 'critical' || a.riskLevel === 'high') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-accent/10 text-accent'
}
function describeType(t: string): string {
  switch (t) {
    case 'Domain Admin': return 'Privileged via AD Domain Admins'
    case 'Enterprise Admin': return 'Privileged via AD Enterprise Admins'
    case 'Linux Sudo': return 'Privileged via sudo / command rules'
    case 'Shared Account': return 'Shared / generic privileged accounts'
    case 'Emergency/Break-Glass': return 'Emergency break-glass accounts'
    case 'Service Account': return 'Automation / service identities'
    default: return 'Privileged account'
  }
}
