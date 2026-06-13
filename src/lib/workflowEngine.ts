// Pure workflow lifecycle logic — no I/O. Drives which actions a reviewer can
// take on a workflow and what state each action moves it to.
import type { Account, Decision, Workflow, WorkflowType } from '../types'

export const WF_STEPS: Record<WorkflowType, string[]> = {
  access_review: ['Generate Campaign', 'Assign Reviewer', 'Review', 'Approve/Revoke', 'Collect Evidence', 'Compliance Closure'],
  exception: ['Raise Request', 'Business Justification', 'Risk Assessment', 'Approval', 'Expiry Assignment', 'Periodic Review', 'Closure'],
}

// Terminal states — no further actions.
const CLOSED_STATUSES = new Set(['Closed', 'Rejected'])

export type WfActionKey = 'advance' | 'certify' | 'revoke' | 'approve' | 'reject' | 'close' | 'renew'

export interface WfAction {
  key: WfActionKey
  label: string
  variant: 'primary' | 'success' | 'danger' | 'secondary'
  needsJustification: boolean
  // For access reviews tied to a real account, also act on that account.
  accountDecision?: Decision
  // Resulting workflow state.
  patch: { currentStep: string; status: string }
}

// Find the account a workflow refers to (item embeds the username), longest match wins.
export function linkedUsername(item: string, accounts: Account[]): string | null {
  let best: string | null = null
  for (const a of accounts) {
    if (item.includes(a.username) && (!best || a.username.length > best.length)) best = a.username
  }
  return best
}

export function isClosed(wf: Workflow): boolean {
  return CLOSED_STATUSES.has(wf.status) || wf.currentStep === 'Compliance Closure' || wf.currentStep === 'Closure'
}

export function getActions(wf: Workflow): WfAction[] {
  return wf.type === 'access_review' ? accessReviewActions(wf) : exceptionActions(wf)
}

function accessReviewActions(wf: Workflow): WfAction[] {
  if (isClosed(wf)) return []
  switch (wf.currentStep) {
    case 'Approve/Revoke':
      return [
        { key: 'certify', label: 'Certify', variant: 'success', needsJustification: true, accountDecision: 'certify', patch: { currentStep: 'Collect Evidence', status: 'Certified' } },
        { key: 'revoke', label: 'Revoke', variant: 'danger', needsJustification: true, accountDecision: 'revoke', patch: { currentStep: 'Collect Evidence', status: 'Revoked' } },
      ]
    case 'Collect Evidence':
      return [{ key: 'close', label: 'Close review', variant: 'primary', needsJustification: false, patch: { currentStep: 'Compliance Closure', status: 'Closed' } }]
    case 'Generate Campaign':
      return [{ key: 'advance', label: 'Assign reviewer', variant: 'secondary', needsJustification: false, patch: { currentStep: 'Assign Reviewer', status: 'Assigning Reviewer' } }]
    case 'Assign Reviewer':
      return [{ key: 'advance', label: 'Start review', variant: 'secondary', needsJustification: false, patch: { currentStep: 'Review', status: 'In Review' } }]
    case 'Review':
      return [{ key: 'advance', label: 'Send for decision', variant: 'primary', needsJustification: false, patch: { currentStep: 'Approve/Revoke', status: 'Awaiting Approval' } }]
    default:
      return []
  }
}

function exceptionActions(wf: Workflow): WfAction[] {
  if (isClosed(wf)) return []
  if (wf.status === 'Expired') {
    return [
      { key: 'renew', label: 'Renew', variant: 'primary', needsJustification: true, patch: { currentStep: 'Approval', status: 'Awaiting Approval' } },
      { key: 'close', label: 'Close', variant: 'secondary', needsJustification: false, patch: { currentStep: 'Closure', status: 'Closed' } },
    ]
  }
  switch (wf.currentStep) {
    case 'Approval':
      return [
        { key: 'approve', label: 'Approve', variant: 'success', needsJustification: true, patch: { currentStep: 'Expiry Assignment', status: 'Approved' } },
        { key: 'reject', label: 'Reject', variant: 'danger', needsJustification: true, patch: { currentStep: 'Closure', status: 'Rejected' } },
      ]
    case 'Raise Request':
      return [{ key: 'advance', label: 'Add justification', variant: 'secondary', needsJustification: false, patch: { currentStep: 'Business Justification', status: 'Pending Justification' } }]
    case 'Business Justification':
      return [{ key: 'advance', label: 'Assess risk', variant: 'secondary', needsJustification: false, patch: { currentStep: 'Risk Assessment', status: 'Pending Assessment' } }]
    case 'Risk Assessment':
      return [{ key: 'advance', label: 'Send for approval', variant: 'primary', needsJustification: false, patch: { currentStep: 'Approval', status: 'Awaiting Approval' } }]
    case 'Expiry Assignment':
      return [{ key: 'advance', label: 'Activate', variant: 'secondary', needsJustification: false, patch: { currentStep: 'Periodic Review', status: 'Active' } }]
    case 'Periodic Review':
      return [{ key: 'close', label: 'Close', variant: 'primary', needsJustification: false, patch: { currentStep: 'Closure', status: 'Closed' } }]
    default:
      return []
  }
}

// Audit action verb for a workflow action.
export function auditVerb(key: WfActionKey): string {
  return {
    advance: 'ADVANCED',
    certify: 'CERTIFIED',
    revoke: 'REVOKED',
    approve: 'APPROVED',
    reject: 'REJECTED',
    close: 'CLOSED',
    renew: 'RENEWED',
  }[key]
}
