// Shown when a Supabase query fails — theme-aware.
import { AlertIcon } from './icons'

export default function ApiError({ message }: { message: string }) {
  return (
    <div className="animate-fade-in flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <AlertIcon className="mt-0.5 shrink-0 text-red-500" width={18} height={18} />
      <div>
        <p className="font-semibold">Couldn’t load data.</p>
        <p className="mt-1 opacity-90">{message}</p>
        <p className="mt-2 opacity-80">
          Check that <code className="rounded bg-red-500/10 px-1">.env</code> has a valid{' '}
          <code className="rounded bg-red-500/10 px-1">VITE_SUPABASE_URL</code> /{' '}
          <code className="rounded bg-red-500/10 px-1">VITE_SUPABASE_ANON_KEY</code> and that the
          tables are seeded.
        </p>
      </div>
    </div>
  )
}
