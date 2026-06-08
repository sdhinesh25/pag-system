// Phase 6 — Page 1: Account Inventory (/accounts)
import { useEffect, useMemo, useState } from 'react'
import type { Account, AccountType, RiskLevel } from '../types'
import { getAccounts } from '../api/accounts'
import Badge from '../components/Badge'

export default function AccountInventory() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all')

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      accounts.filter(
        (a) =>
          (riskFilter === 'all' || a.riskLevel === riskFilter) &&
          (typeFilter === 'all' || a.type === typeFilter),
      ),
    [accounts, riskFilter, typeFilter],
  )

  if (loading) return <p className="text-gray-500">Loading accounts…</p>
  if (error) return <ApiError message={error} />

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Account Inventory</h2>
      <p className="mt-1 text-sm text-gray-500">
        {filtered.length} of {accounts.length} accounts
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Select
          label="Risk Level"
          value={riskFilter}
          onChange={(v) => setRiskFilter(v as RiskLevel | 'all')}
          options={['all', 'critical', 'high', 'medium', 'low']}
        />
        <Select
          label="Type"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as AccountType | 'all')}
          options={['all', 'user', 'service']}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <Th>Username</Th>
              <Th>Type</Th>
              <Th>Department</Th>
              <Th>Owner</Th>
              <Th>Last Login</Th>
              <Th>Risk Level</Th>
              <Th>Orphaned</Th>
              <Th>Days Since Review</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} className={rowClass(a)}>
                <td className="px-4 py-3 font-medium text-gray-900">{a.username}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{a.type}</td>
                <td className="px-4 py-3 text-gray-600">{a.department}</td>
                <td className="px-4 py-3 text-gray-600">
                  {a.owner ?? <span className="text-red-600">— none —</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{a.lastLogin}</td>
                <td className="px-4 py-3">
                  <Badge level={a.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  {a.isOrphaned ? (
                    <span className="font-medium text-red-700">Yes</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td
                  className={`px-4 py-3 ${a.daysSinceReview > 180 ? 'font-medium text-amber-700' : 'text-gray-600'}`}
                >
                  {a.daysSinceReview}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No accounts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex gap-4 text-xs text-gray-400">
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-red-50 align-middle ring-1 ring-red-200" />
          Orphaned
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-amber-50 align-middle ring-1 ring-amber-200" />
          Review &gt; 180 days
        </span>
      </p>
    </div>
  )
}

// Red wins over amber: an orphaned account is the more severe flag.
function rowClass(a: Account): string {
  if (a.isOrphaned) return 'bg-red-50'
  if (a.daysSinceReview > 180) return 'bg-amber-50'
  return 'hover:bg-gray-50'
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm capitalize focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ApiError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-medium">Couldn’t reach the API.</p>
      <p className="mt-1">{message}</p>
      <p className="mt-2 text-red-600">
        Start the mock backend in a separate terminal:{' '}
        <code className="rounded bg-red-100 px-1">npm run api</code>
      </p>
    </div>
  )
}
