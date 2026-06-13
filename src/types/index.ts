// Shared TypeScript types — aligned with the Supabase schema.

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// Values as stored in Supabase (string columns, mixed case).
export type PamStatus = 'Onboarded' | 'Pending Onboarding' | 'Not Onboarded'
export type Certification = 'Certified' | 'Not Certified' | 'Revoked'
export type ReviewStatus = 'Continue' | 'Pending' | 'Revoked'

// One row of the `accounts` table.
export interface Account {
  id: string
  username: string
  accountType: string // Domain Admin, Linux Sudo, Shared Account, Enterprise Admin, Emergency/Break-Glass
  sourceSystem: string // Active Directory
  server: string
  owner: string | null
  businessOwner: string | null
  applicationOwner: string | null
  reviewer: string | null
  lastLogin: string
  created: string
  lastReviewed: string
  ownerTerminated: boolean
  riskLevel: RiskLevel
  pamStatus: PamStatus
  reviewStatus: ReviewStatus
  certification: Certification
  reviewDue: string
  permissions: string
  privilegeCategory: string
  isOrphaned: boolean
  daysSinceReview: number // derived from lastReviewed (see lib/accountModel)
  isOverdue: boolean // derived: daysSinceReview > REVIEW_CYCLE_DAYS
}

export type WorkflowType = 'access_review' | 'exception'

// One row of the `workflows` table.
export interface Workflow {
  id: string
  item: string
  currentStep: string
  status: string
  reason: string | null
  owner: string | null
  type: WorkflowType
  expiry: string | null
  age: string | null
}

// One row of the `audit_log` table.
export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  justification: string | null
}

// Certify / Revoke decision taken on the Account Detail page.
export type Decision = 'certify' | 'revoke'
