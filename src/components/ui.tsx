// Shared, theme-aware UI primitives built on the design tokens.
import type { RiskLevel, Certification, PamStatus } from '../types'
import { useTheme } from '../theme/ThemeProvider'
import { MoonIcon, SunIcon } from './icons'

/* ---------- Card ---------- */
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>
      {children}
    </div>
  )
}

/* ---------- Button ---------- */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on hover:bg-accent-hover shadow-sm',
  secondary: 'border border-line-strong bg-surface text-strong hover:bg-surface-hover',
  ghost: 'text-muted hover:bg-surface-hover hover:text-strong',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  )
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function PageSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

/* ---------- Pills (theme-aware) ---------- */
const pillBase =
  'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1'

export function RiskPill({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    critical: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30',
    high: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/30',
    medium: 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:ring-yellow-500/30',
    low: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30',
  }
  return <span className={`${pillBase} ${styles[level]}`}>{cap(level)}</span>
}

export function PamPill({ status }: { status: PamStatus }) {
  const styles: Record<PamStatus, string> = {
    Onboarded: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30',
    'Pending Onboarding': 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/30',
    'Not Onboarded': 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30',
  }
  return <span className={`${pillBase} ${styles[status]}`}>{status}</span>
}

export function CertPill({ value }: { value: Certification }) {
  const styles: Record<Certification, string> = {
    Certified: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30',
    'Not Certified': 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30',
    Revoked: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30',
  }
  return <span className={`${pillBase} ${styles[value]}`}>{value}</span>
}

// Overdue-for-review marker.
export function OverdueTag() {
  return (
    <span className={`${pillBase} gap-1 bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30`}>
      ⏰ Overdue
    </span>
  )
}

// Generic accent-tinted tag.
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'accent' | 'success'
}) {
  const tones = {
    neutral: 'bg-surface-hover text-muted ring-line',
    accent: 'bg-accent-soft/40 text-accent ring-accent/20 dark:bg-accent/15',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30',
  }
  return <span className={`${pillBase} font-medium ${tones[tone]}`}>{children}</span>
}

/* ---------- Theme toggle ---------- */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light' : 'Switch to dark'}
      aria-label="Toggle color theme"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-hover hover:text-strong"
    >
      {isDark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </button>
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
