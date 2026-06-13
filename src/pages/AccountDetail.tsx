// Page: Account Detail (/accounts/:id) — Certify / Revoke with audit logging.
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Account, AuditEntry, Decision } from '../types'
import { decideAccount, getAccountById } from '../api/accounts'
import { getAuditForTarget } from '../api/auditLog'
import { syncReviewForAccount } from '../api/workflows'
import ConfirmModal from '../components/ConfirmModal'
import ApiError from '../components/ApiError'
import { Button, Card, CertPill, OverdueTag, PageSkeleton, RiskPill, Tag } from '../components/ui'
import { ChevronLeft, CheckIcon, AlertIcon, UsersIcon, ShieldIcon, FlowIcon, ListIcon, SparkleIcon } from '../components/icons'

const CURRENT_USER = 'alice.manager'

export default function AccountDetail() {
  const { id = '' } = useParams()
  const [account, setAccount] = useState<Account | null>(null)
  const [history, setHistory] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Decision | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const loadHistory = useCallback((username: string) => {
    getAuditForTarget(username).then(setHistory).catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    getAccountById(id)
      .then((acc) => {
        setAccount(acc)
        if (acc) loadHistory(acc.username)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id, loadHistory])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function onDecision(justification: string) {
    if (!account || !pending) return
    setBusy(true)
    try {
      const updated = await decideAccount(account, pending, justification, CURRENT_USER)
      setAccount(updated)
      loadHistory(updated.username)
      // Keep the two halves in sync: advance this account's open review workflow.
      const movedWf = await syncReviewForAccount(updated.username, pending).catch(() => null)
      const base = pending === 'certify' ? 'Account certified successfully' : 'Access revoked'
      setToast({ kind: 'ok', msg: movedWf ? `${base} · review moved to ${movedWf.currentStep}` : base })
      setPending(null)
    } catch (e) {
      setToast({ kind: 'err', msg: `Action failed: ${(e as Error).message}` })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ApiError message={error} />
  if (!account)
    return (
      <div>
        <p className="text-muted">Account not found.</p>
        <Link to="/accounts" className="mt-2 inline-block text-accent hover:underline">← Back to inventory</Link>
      </div>
    )

  const findings = buildFindings(account)
  const namePart = account.username.split('\\').pop() ?? account.username
  const initials = namePart.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'AC'
  const riskTone = account.riskLevel === 'critical' || account.riskLevel === 'high' ? 'bad' : account.riskLevel === 'medium' ? 'warn' : 'good'
  const vaultTone = account.pamStatus === 'Onboarded' ? 'good' : account.pamStatus === 'Pending Onboarding' ? 'warn' : 'bad'
  const certTone = account.certification === 'Certified' ? 'good' : account.certification === 'Revoked' ? 'bad' : 'warn'

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link to="/accounts" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft width={14} height={14} /> Account Inventory
      </Link>

      {/* hero header */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg font-bold text-accent ring-1 ring-accent/20">
            {initials}
          </div>
          <div>
            <h1 className="font-mono text-xl font-bold tracking-tight text-strong">{account.username}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span>{account.accountType}</span>
              <span className="text-subtle">·</span>
              <span>{account.sourceSystem}</span>
              <span className="text-subtle">·</span>
              <span>{account.server}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <RiskPill level={account.riskLevel} />
              <Tag>PAM: {account.pamStatus}</Tag>
              <CertPill value={account.certification} />
              {account.isOverdue && <OverdueTag />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="success" onClick={() => setPending('certify')} disabled={busy}>
            <CheckIcon width={16} height={16} /> Certify
          </Button>
          <Button variant="danger" onClick={() => setPending('revoke')} disabled={busy}>Revoke</Button>
        </div>
      </Card>

      {/* at-a-glance stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Risk Level" value={cap(account.riskLevel)} tone={riskTone} />
        <StatTile label="Vault Status" value={account.pamStatus} tone={vaultTone} />
        <StatTile label="Certification" value={account.certification} tone={certTone} />
        <StatTile label="Days Since Review" value={String(account.daysSinceReview)} hint={`Due ${account.reviewDue}`} tone={account.isOverdue ? 'bad' : 'neutral'} />
      </div>

      {/* main 2/3 + sidebar 1/3 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Account Details" icon={<UsersIcon width={15} height={15} />}>
            <Dl cols={2} rows={[
              ['Username', account.username],
              ['Account Type', account.accountType],
              ['Source System', account.sourceSystem],
              ['Server / App', account.server],
              ['Owner', account.owner ?? '⚠ Unassigned', account.owner ? undefined : 'warn'],
              ['Business Owner', account.businessOwner ?? '—'],
              ['Application Owner', account.applicationOwner ?? '—'],
              ['Reviewer', account.reviewer ?? '—'],
              ['Review Status', account.reviewStatus],
              ['Review Due', account.reviewDue, account.isOverdue ? 'bad' : undefined],
            ]} />
          </Panel>

          <Panel title="Why This Is Privileged" icon={<ShieldIcon width={15} height={15} />}>
            <p className="text-sm text-muted">
              Classified as <span className="font-medium text-strong">{account.privilegeCategory}</span> on{' '}
              <span className="font-medium text-strong">{account.sourceSystem}</span>.
            </p>
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">Granting rule</p>
              <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-elevated p-3 font-mono text-xs text-strong">
                {account.permissions}
              </pre>
            </div>
          </Panel>

          <Panel title="Review History" icon={<ListIcon width={15} height={15} />}>
            {history.length === 0 ? (
              <p className="text-sm text-muted">No review actions recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {history.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="whitespace-nowrap text-subtle">{new Date(h.timestamp).toLocaleString()}</span>
                    <ActionBadge action={h.action} />
                    <span className="font-medium text-strong">{h.actor}</span>
                    {h.justification && <span className="text-muted">— {h.justification}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="PAM (CyberArk)" icon={<ShieldIcon width={15} height={15} />}>
            <div className={`mb-3 flex items-center gap-2.5 rounded-lg p-3 text-sm font-medium ${vaultTone === 'good' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : vaultTone === 'warn' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {vaultTone === 'good' ? <CheckIcon width={16} height={16} /> : <AlertIcon width={16} height={16} />}
              <span>
                {account.pamStatus === 'Onboarded'
                  ? 'Vaulted & auto-rotated'
                  : account.pamStatus === 'Pending Onboarding'
                    ? 'Onboarding in progress'
                    : 'Not vaulted — unmanaged'}
              </span>
            </div>
            <Dl rows={[
              ['Vault Status', account.pamStatus],
              ['Onboarded', account.pamStatus === 'Onboarded' ? 'Yes' : 'No', account.pamStatus === 'Onboarded' ? 'good' : 'bad'],
              ['Privilege Category', account.privilegeCategory],
              ['Certification', account.certification, certTone],
            ]} />
          </Panel>

          <Panel title="Activity" icon={<FlowIcon width={15} height={15} />}>
            <Dl rows={[
              ['Last Login', account.lastLogin],
              ['Created', account.created],
              ['Last Reviewed', account.lastReviewed],
              ['Days Since Review', String(account.daysSinceReview)],
              ['Orphaned', account.isOrphaned ? 'Yes' : 'No', account.isOrphaned ? 'bad' : undefined],
              ['Owner Terminated', account.ownerTerminated ? 'Yes' : 'No', account.ownerTerminated ? 'bad' : undefined],
            ]} />
          </Panel>

          <Panel title="Findings" icon={<AlertIcon width={15} height={15} />}>
            {findings.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckIcon width={16} height={16} /> In good standing
              </div>
            ) : (
              <ul className="space-y-2.5">
                {findings.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${f.severity === 'high' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}`}>
                      <AlertIcon width={12} height={12} />
                    </span>
                    <div>
                      <span className="font-medium text-strong">{f.label}</span>
                      <span className="text-muted"> — {f.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <AiRiskAnalysis account={account} />
        </div>
      </div>

      {pending && (
        <ConfirmModal
          title={pending === 'revoke' ? `Are you sure you want to revoke access for ${account.username}?` : `Certify access for ${account.username}?`}
          confirmLabel={pending === 'revoke' ? 'Revoke access' : 'Certify'}
          tone={pending === 'revoke' ? 'danger' : 'success'}
          onClose={() => setPending(null)}
          onConfirm={onDecision}
        />
      )}

      {toast && (
        <div
          className={`animate-toast-in fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-pop ${
            toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.kind === 'ok' ? <CheckIcon width={16} height={16} /> : <AlertIcon width={16} height={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

interface Finding {
  label: string
  detail: string
  severity: 'high' | 'medium'
}

function buildFindings(a: Account): Finding[] {
  const out: Finding[] = []
  if (a.isOrphaned || !a.owner) out.push({ label: 'Orphaned account', detail: 'No assigned owner.', severity: 'high' })
  if (a.ownerTerminated) out.push({ label: 'Owner terminated', detail: 'Account owner has left the organisation.', severity: 'high' })
  if (a.pamStatus !== 'Onboarded') out.push({ label: 'Not vaulted', detail: `PAM status is "${a.pamStatus}".`, severity: 'medium' })
  if (a.daysSinceReview > 180) out.push({ label: 'Stale review', detail: `Last reviewed ${a.daysSinceReview} days ago (> 180).`, severity: 'medium' })
  if (a.accountType === 'Emergency/Break-Glass') out.push({ label: 'Standing break-glass access', detail: 'Emergency account with persistent access.', severity: 'medium' })
  return out
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Tone = 'good' | 'bad' | 'warn' | 'neutral'

const TONE_TEXT: Record<Tone, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  bad: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-strong',
}

function StatTile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: Tone }) {
  const accent: Record<Tone, string> = {
    good: 'bg-emerald-500',
    bad: 'bg-red-500',
    warn: 'bg-amber-500',
    neutral: 'bg-accent',
  }
  return (
    <Card className="relative overflow-hidden p-4">
      <span className={`absolute left-0 top-0 h-full w-1 ${accent[tone]}`} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
      <p className={`mt-1.5 text-lg font-bold ${TONE_TEXT[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-subtle">
        {icon && <span className="text-muted">{icon}</span>}
        {title}
      </h3>
      {children}
    </Card>
  )
}

type Row = [string, string, (Tone | undefined)?]

function Dl({ rows, cols = 1 }: { rows: Row[]; cols?: 1 | 2 }) {
  return (
    <dl className={cols === 2 ? 'grid gap-x-8 sm:grid-cols-2' : ''}>
      {rows.map(([k, v, tone]) => (
        <div key={k} className="flex items-center justify-between gap-3 border-b border-line/60 py-2 text-sm last:border-0">
          <dt className="text-muted">{k}</dt>
          <dd className={`text-right font-medium ${tone ? TONE_TEXT[tone] : 'text-strong'}`}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

// Live AI analysis — calls the Anthropic Messages API directly from the browser.
// Note: VITE_ANTHROPIC_KEY is bundled into the client, so this is for local/demo use only.
function AiRiskAnalysis({ account }: { account: Account }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [analysis, setAnalysis] = useState('')

  async function generate() {
    setStatus('loading')
    setAnalysis('')
    const prompt = `You are a PAG security analyst. Analyze this privileged account and give exactly 2 sentences: first sentence is the risk summary, second sentence is the recommended action. Account: ${account.username}, Type: ${account.accountType}, Risk Level: ${account.riskLevel}, PAM Status: ${account.pamStatus}, Days Since Review: ${account.daysSinceReview}, Is Orphaned: ${account.isOrphaned}, Owner: ${account.owner ?? 'Unassigned'}. Be concise and professional.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY as string,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const text: string | undefined = data?.content?.[0]?.text?.trim()
      if (!text) throw new Error('Empty response')
      setAnalysis(text)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rounded-xl border border-violet-500/40 bg-violet-500/[0.04] p-4 dark:bg-violet-500/[0.07]">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
        <SparkleIcon width={15} height={15} /> AI Risk Analysis
      </h3>

      {status === 'idle' && (
        <button
          onClick={generate}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        >
          <SparkleIcon width={16} height={16} /> Generate AI Risk Analysis
        </button>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2.5 py-1 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          Analyzing account…
        </div>
      )}

      {status === 'done' && (
        <>
          <p className="text-sm leading-relaxed text-strong">{analysis}</p>
          <button onClick={generate} className="mt-3 text-xs font-medium text-violet-600 hover:underline dark:text-violet-300">
            Regenerate
          </button>
        </>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-red-500">AI analysis unavailable</span>
          <button onClick={generate} className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-300">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    CERTIFIED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    REVOKED: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    FLAGGED: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    ESCALATED: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[action] ?? 'bg-surface-hover text-muted'}`}>{action}</span>
}
