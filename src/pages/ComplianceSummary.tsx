// Phase 6 — Page 4: Compliance Summary (/compliance)
import { useEffect, useState } from 'react'
import type { Account, Review } from '../types'
import { getAccounts } from '../api/accounts'
import { getReviews } from '../api/reviews'
import { ApiError } from './AccountInventory'

interface Check {
  label: string
  pass: boolean
  detail: string
}

function buildChecks(accounts: Account[], reviews: Review[]): Check[] {
  const orphaned = accounts.filter((a) => a.isOrphaned)
  const stale = accounts.filter((a) => a.daysSinceReview > 180)
  const criticalPending = reviews.filter(
    (r) => r.riskLevel === 'critical' && r.status === 'pending',
  )

  return [
    {
      label: 'No orphaned accounts exist',
      pass: orphaned.length === 0,
      detail: `${orphaned.length} orphaned account(s)`,
    },
    {
      label: 'All accounts reviewed within 180 days',
      pass: stale.length === 0,
      detail: `${stale.length} account(s) with review older than 180 days`,
    },
    {
      label: 'No critical risk accounts pending review',
      pass: criticalPending.length === 0,
      detail: `${criticalPending.length} critical review(s) still pending`,
    },
  ]
}

export default function ComplianceSummary() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAccounts(), getReviews()])
      .then(([a, r]) => {
        setAccounts(a)
        setReviews(r)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Computing compliance…</p>
  if (error) return <ApiError message={error} />

  const checks = buildChecks(accounts, reviews)
  const passed = checks.filter((c) => c.pass).length

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Compliance Summary</h2>
      <p className="mt-1 text-sm text-gray-500">
        {passed} of {checks.length} rules passing
      </p>

      <ul className="mt-4 space-y-2">
        {checks.map((c) => (
          <li
            key={c.label}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{c.pass ? '✅' : '❌'}</span>
              <span className="font-medium text-gray-900">{c.label}</span>
            </div>
            <span
              className={`text-sm ${c.pass ? 'text-gray-400' : 'text-red-600'}`}
            >
              {c.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
