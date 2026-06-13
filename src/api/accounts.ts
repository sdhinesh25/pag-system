// Accounts data access (Supabase).
import { supabase } from '../lib/supabase'
import type { Account, Decision } from '../types'
import { addAuditEntry } from './auditLog'
import { enrichAccount, today, addDays, REVIEW_CYCLE_DAYS } from '../lib/accountModel'

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from('accounts').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []).map((a) => enrichAccount(a as Account))
}

export async function getAccountById(id: string): Promise<Account | null> {
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? enrichAccount(data as Account) : null
}

// Certify or revoke an account, then write the decision to the audit log.
// Recomputes review timing so daysSinceReview / reviewDue / isOverdue stay correct.
export async function decideAccount(
  account: Account,
  decision: Decision,
  justification: string,
  actor = 'alice.manager',
): Promise<Account> {
  const reviewedOn = today()
  const patch =
    decision === 'certify'
      ? { certification: 'Certified' as const, reviewStatus: 'Continue' as const }
      : { certification: 'Revoked' as const, reviewStatus: 'Revoked' as const }

  const { data, error } = await supabase
    .from('accounts')
    .update({
      ...patch,
      lastReviewed: reviewedOn,
      daysSinceReview: 0,
      reviewDue: addDays(reviewedOn, REVIEW_CYCLE_DAYS),
    })
    .eq('id', account.id)
    .select()
    .single()
  if (error) throw new Error(error.message)

  await addAuditEntry({
    actor,
    action: decision === 'certify' ? 'CERTIFIED' : 'REVOKED',
    target: account.username,
    justification,
  })

  return enrichAccount(data as Account)
}
