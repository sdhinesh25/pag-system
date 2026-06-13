// Workflows data access (Supabase).
import { supabase } from '../lib/supabase'
import type { Decision, Workflow } from '../types'
import { isClosed } from '../lib/workflowEngine'

export async function getWorkflows(): Promise<Workflow[]> {
  const { data, error } = await supabase.from('workflows').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as Workflow[]
}

export async function updateWorkflow(
  id: string,
  patch: Partial<Pick<Workflow, 'currentStep' | 'status' | 'reason'>>,
): Promise<Workflow> {
  const { data, error } = await supabase.from('workflows').update(patch).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Workflow
}

// When an account is certified/revoked on its detail page, push its open access
// review forward so the two halves of the product stay in sync.
export async function syncReviewForAccount(username: string, decision: Decision): Promise<Workflow | null> {
  const { data, error } = await supabase.from('workflows').select('*').eq('type', 'access_review')
  if (error) throw new Error(error.message)
  const open = (data as Workflow[]).find((w) => w.item.includes(username) && !isClosed(w))
  if (!open) return null
  return updateWorkflow(open.id, {
    currentStep: 'Collect Evidence',
    status: decision === 'certify' ? 'Certified' : 'Revoked',
  })
}
