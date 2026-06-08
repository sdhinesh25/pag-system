// Phase 4 — Reviews API layer (backed by json-server on :3001).
import type { Review, ReviewDecision, AuditEntry } from '../types'

const BASE = 'http://localhost:3001'

export const getReviews = (): Promise<Review[]> =>
  fetch(`${BASE}/reviews`).then((r) => {
    if (!r.ok) throw new Error(`Failed to load reviews (${r.status})`)
    return r.json()
  })

export const updateReview = (
  id: string,
  decision: ReviewDecision,
  justification: string,
): Promise<Review> =>
  fetch(`${BASE}/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      justification,
      status:
        decision === 'approve'
          ? 'approved'
          : decision === 'revoke'
            ? 'revoked'
            : decision === 'escalate'
              ? 'escalated'
              : 'pending',
    }),
  }).then((r) => {
    if (!r.ok) throw new Error(`Failed to update review ${id} (${r.status})`)
    return r.json()
  })

export const getAuditLog = (): Promise<AuditEntry[]> =>
  fetch(`${BASE}/auditLog`).then((r) => {
    if (!r.ok) throw new Error(`Failed to load audit log (${r.status})`)
    return r.json()
  })
