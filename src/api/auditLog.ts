// Audit log data access (Supabase).
import { supabase } from '../lib/supabase'
import type { AuditEntry } from '../types'

export async function getAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('timestamp', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as AuditEntry[]
}

// Review History on the Account Detail page is the audit trail for one account.
export async function getAuditForTarget(target: string): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('target', target)
    .order('timestamp', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as AuditEntry[]
}

export async function addAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>,
): Promise<AuditEntry> {
  const row: AuditEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  }
  const { data, error } = await supabase.from('audit_log').insert(row).select().single()
  if (error) throw new Error(error.message)
  return data as AuditEntry
}
