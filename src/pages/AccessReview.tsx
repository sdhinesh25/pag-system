// Phase 6 — Page 2: Access Review (/reviews)
import { useEffect, useState } from 'react'
import { useReviewStore } from '../store/useReviewStore'
import type { ReviewStatus } from '../types'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import { ApiError } from './AccountInventory'

type Action = 'approve' | 'revoke' | 'escalate'

const statusStyles: Record<ReviewStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  revoked: 'bg-gray-200 text-gray-700',
  escalated: 'bg-amber-100 text-amber-800',
}

const actionButtons: { action: Action; label: string }[] = [
  { action: 'approve', label: 'Approve' },
  { action: 'revoke', label: 'Revoke' },
  { action: 'escalate', label: 'Escalate' },
]

export default function AccessReview() {
  const { reviews, loading, error, fetchReviews, submitDecision } =
    useReviewStore()
  const [pending, setPending] = useState<{
    id: string
    action: Action
    username: string
  } | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  if (loading && reviews.length === 0)
    return <p className="text-gray-500">Loading reviews…</p>
  if (error) return <ApiError message={error} />

  const reviewed = reviews.filter((r) => r.status !== 'pending').length

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Access Review</h2>
      <p className="mt-1 text-sm font-medium text-gray-600">
        Reviewed: {reviewed} / {reviews.length}
      </p>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Risk Level</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map((r) => (
              <tr
                key={r.id}
                className={r.status === 'overdue' ? 'bg-red-50' : 'hover:bg-gray-50'}
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {r.username}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.reviewer}</td>
                <td className="px-4 py-3 text-gray-600">{r.dueDate}</td>
                <td className="px-4 py-3">
                  <Badge level={r.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.decision === null ? (
                    <div className="flex justify-end gap-1.5">
                      {actionButtons.map(({ action, label }) => (
                        <button
                          key={action}
                          onClick={() =>
                            setPending({ id: r.id, action, username: r.username })
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">decided</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending && (
        <ConfirmModal
          title={`${pending.action[0].toUpperCase()}${pending.action.slice(1)} access for ${pending.username}?`}
          confirmLabel="Submit decision"
          onClose={() => setPending(null)}
          onConfirm={async (justification) => {
            await submitDecision(pending.id, pending.action, justification)
            setPending(null)
          }}
        />
      )}
    </div>
  )
}
