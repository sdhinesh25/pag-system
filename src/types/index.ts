// Phase 3 — Shared TypeScript types.

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type AccountType = 'service' | 'user'

export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'revoked'
  | 'escalated'
  | 'overdue'

export type ReviewDecision = 'approve' | 'revoke' | 'escalate' | null

export interface Account {
  id: string
  username: string
  type: AccountType
  department: string
  owner: string | null
  lastLogin: string
  riskLevel: RiskLevel
  isOrphaned: boolean
  daysSinceReview: number
}

export interface Review {
  id: string
  accountId: string
  username: string
  reviewer: string
  dueDate: string
  status: ReviewStatus
  decision: ReviewDecision
  justification: string | null
  riskLevel: RiskLevel
}

export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  justification: string
}
