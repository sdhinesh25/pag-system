// Page: Login (/login) — Supabase email/password auth.
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { ShieldIcon, AlertIcon } from '../components/icons'
import { ThemeToggle } from '../components/ui'

// Shown on the login screen so anyone can try the demo instantly.
const DEMO_EMAIL = 'demo@pag.app'
const DEMO_PASSWORD = 'pagdemo123'

export default function Login() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

  // Already signed in → bounce to the app.
  if (session) return <Navigate to="/dashboard" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(error)
    else navigate(from, { replace: true })
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 text-strong">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-on shadow-sm">
            <ShieldIcon width={28} height={28} />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Privileged Access Governance</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-subtle">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="h-10 w-full rounded-lg border border-line-strong bg-canvas px-3 text-sm text-strong placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-subtle">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded-lg border border-line-strong bg-canvas px-3 text-sm text-strong placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400">
              <AlertIcon width={16} height={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-on shadow-sm transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* demo helper */}
        <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface/60 p-3 text-center text-xs text-muted">
          <p>
            Demo account — <span className="font-mono text-strong">{DEMO_EMAIL}</span> / <span className="font-mono text-strong">{DEMO_PASSWORD}</span>
          </p>
          <button onClick={fillDemo} type="button" className="mt-1.5 font-semibold text-accent hover:underline">
            Use demo credentials
          </button>
        </div>
      </div>
    </div>
  )
}
