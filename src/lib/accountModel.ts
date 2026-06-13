// Single source of truth for review timing.
// `lastReviewed` is authoritative; daysSinceReview / reviewDue / isOverdue are
// always DERIVED from it so they can never drift out of sync.
import type { Account } from '../types'

export const REVIEW_CYCLE_DAYS = 180 // recertification cadence
const DAY = 86_400_000

function parseISO(s: string): number {
  const t = Date.parse(s)
  return Number.isNaN(t) ? NaN : t
}

export function daysSince(dateStr: string, now = Date.now()): number {
  const t = parseISO(dateStr)
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((now - t) / DAY))
}

export function addDays(dateStr: string, days: number): string {
  const t = parseISO(dateStr)
  if (Number.isNaN(t)) return dateStr
  return new Date(t + days * DAY).toISOString().slice(0, 10)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// Recompute the derived review fields for an account.
export function enrichAccount(a: Account, now = Date.now()): Account {
  const daysSinceReview = daysSince(a.lastReviewed, now)
  return {
    ...a,
    daysSinceReview,
    reviewDue: addDays(a.lastReviewed, REVIEW_CYCLE_DAYS),
    isOverdue: daysSinceReview > REVIEW_CYCLE_DAYS,
  }
}
