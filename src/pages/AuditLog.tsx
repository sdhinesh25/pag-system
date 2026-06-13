// Page: Audit Log (/audit) — backed by Supabase.
import { useEffect, useMemo, useState } from 'react'
import type { AuditEntry } from '../types'
import { getAuditLog } from '../api/auditLog'
import ApiError from '../components/ApiError'
import { Card, PageSkeleton } from '../components/ui'
import { SearchIcon } from '../components/icons'

const actionStyles: Record<string, string> = {
  CERTIFIED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  REVOKED: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  FLAGGED: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  ESCALATED: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAuditLog()
      .then(setEntries)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    if (!q) return sorted
    return sorted.filter(
      (e) =>
        e.actor.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.justification ?? '').toLowerCase().includes(q),
    )
  }, [entries, search])

  if (loading) return <PageSkeleton />
  if (error) return <ApiError message={error} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strong">Audit Log</h1>
        <p className="mt-1 text-sm text-muted">{entries.length} entries · immutable record of every governance action</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line p-3">
          <div className="relative max-w-xs">
            <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, target, action…"
              className="w-full rounded-lg border border-line-strong bg-canvas py-2 pl-9 pr-3 text-sm text-strong placeholder:text-subtle focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-surface-hover">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-strong">{e.actor}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionStyles[e.action] ?? 'bg-surface-hover text-muted'}`}>{e.action}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-muted">{e.target}</td>
                  <td className="px-4 py-3 text-muted">{e.justification ?? <span className="text-subtle">—</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-subtle">No entries match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
