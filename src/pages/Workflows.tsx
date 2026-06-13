// Page: Workflows (/workflows) — actionable Access Review lifecycle.
import { useEffect, useMemo, useState } from 'react'
import type { Account, Workflow } from '../types'
import { getWorkflows, updateWorkflow } from '../api/workflows'
import { getAccounts, decideAccount } from '../api/accounts'
import { addAuditEntry } from '../api/auditLog'
import { WF_STEPS, getActions, linkedUsername, auditVerb, type WfAction } from '../lib/workflowEngine'
import ApiError from '../components/ApiError'
import ConfirmModal from '../components/ConfirmModal'
import { Button, Card, PageSkeleton } from '../components/ui'
import { CheckIcon, AlertIcon, SearchIcon } from '../components/icons'

const CURRENT_USER = 'alice.manager'

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [pendingAction, setPendingAction] = useState<{ wf: Workflow; action: WfAction } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    Promise.all([getWorkflows(), getAccounts()])
      .then(([wf, accs]) => {
        setWorkflows(wf)
        setAccounts(accs)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function execute(wf: Workflow, action: WfAction, justification: string) {
    setBusyId(wf.id)
    try {
      const updated = await updateWorkflow(wf.id, action.patch)
      const username = linkedUsername(wf.item, accounts)

      if (action.accountDecision && username) {
        const acc = accounts.find((a) => a.username === username)
        if (acc) {
          const updatedAcc = await decideAccount(acc, action.accountDecision, justification || `${action.label} via workflow`, CURRENT_USER)
          setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)))
        }
      } else {
        await addAuditEntry({
          actor: CURRENT_USER,
          action: auditVerb(action.key),
          target: username ?? wf.item,
          justification: justification || `${action.label} · ${wf.currentStep} → ${action.patch.currentStep}`,
        })
      }

      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? updated : w)))
      setToast({ kind: 'ok', msg: `${action.label} — ${wf.item}` })
      setPendingAction(null)
    } catch (e) {
      setToast({ kind: 'err', msg: `Action failed: ${(e as Error).message}` })
    } finally {
      setBusyId(null)
    }
  }

  function onActionClick(wf: Workflow, action: WfAction) {
    if (action.needsJustification) setPendingAction({ wf, action })
    else execute(wf, action, '')
  }

  const accessReviews = useMemo(() => workflows.filter((w) => w.type === 'access_review'), [workflows])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of accessReviews) m.set(w.currentStep, (m.get(w.currentStep) ?? 0) + 1)
    return m
  }, [accessReviews])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accessReviews.filter(
      (w) =>
        (step === 'all' || w.currentStep === step) &&
        (q === '' ||
          w.item.toLowerCase().includes(q) ||
          (w.owner ?? '').toLowerCase().includes(q) ||
          (w.reason ?? '').toLowerCase().includes(q) ||
          (linkedUsername(w.item, accounts) ?? '').toLowerCase().includes(q)),
    )
  }, [accessReviews, step, search, accounts])

  if (loading) return <PageSkeleton />
  if (error) return <ApiError message={error} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strong">Workflows</h1>
        <p className="mt-1 text-sm text-muted">Access review lifecycle — act on each item to move it through the process.</p>
      </div>

      {/* search */}
      <div className="relative max-w-sm">
        <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item, owner, reason or account…"
          className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-strong placeholder:text-subtle transition-colors hover:bg-surface-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* step chips */}
      <div className="flex flex-wrap gap-2">
        <Chip label="All" count={accessReviews.length} active={step === 'all'} onClick={() => setStep('all')} />
        {WF_STEPS.access_review.map((s) => (
          <Chip key={s} label={s} count={counts.get(s) ?? 0} active={step === s} onClick={() => setStep(s)} />
        ))}
      </div>

      {/* table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-elevated text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Current Step</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((w) => {
                const username = linkedUsername(w.item, accounts)
                const actions = getActions(w)
                return (
                  <tr key={w.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <div className="font-medium text-strong">{w.item}</div>
                      {username && (
                        <div className="mt-0.5 text-xs text-subtle">
                          linked to <span className="font-medium text-accent">{username}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-accent-soft/40 px-2 py-0.5 text-xs font-medium text-accent dark:bg-accent/15">{w.currentStep}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                    <td className="px-4 py-3 text-muted">{w.reason ?? <span className="text-subtle">—</span>}</td>
                    <td className="px-4 py-3 text-muted">{w.owner ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {actions.length === 0 ? (
                          <span className="text-xs text-subtle">Closed</span>
                        ) : (
                          actions.map((a) => (
                            <Button
                              key={a.key}
                              variant={a.variant}
                              disabled={busyId === w.id}
                              onClick={() => onActionClick(w, a)}
                              className="px-3 py-1.5 text-xs"
                            >
                              {a.label}
                            </Button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-subtle">No matching workflows.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {pendingAction && (
        <ConfirmModal
          title={`${pendingAction.action.label} — ${pendingAction.wf.item}?`}
          confirmLabel={pendingAction.action.label}
          tone={pendingAction.action.variant === 'danger' ? 'danger' : pendingAction.action.variant === 'success' ? 'success' : 'primary'}
          onClose={() => setPendingAction(null)}
          onConfirm={(j) => execute(pendingAction.wf, pendingAction.action, j)}
        />
      )}

      {toast && (
        <div className={`animate-toast-in fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-pop ${toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.kind === 'ok' ? <CheckIcon width={16} height={16} /> : <AlertIcon width={16} height={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Chip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'border-accent bg-accent text-accent-on' : 'border-line-strong bg-surface text-muted hover:bg-surface-hover hover:text-strong'
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/20 text-accent-on' : 'bg-surface-hover text-muted'}`}>{count}</span>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In Review': 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    'Awaiting Approval': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    'Assigning Reviewer': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    Certified: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Revoked: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    Rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    Closed: 'bg-surface-hover text-muted',
    Draft: 'bg-surface-hover text-muted',
    Expired: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    'Pending Justification': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    'Pending Assessment': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? 'bg-surface-hover text-muted'}`}>{status}</span>
}
