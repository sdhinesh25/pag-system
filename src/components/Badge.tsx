// Phase 8 — Risk-level Badge component.
import type { RiskLevel } from '../types'

const colors: Record<RiskLevel, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

export default function Badge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${colors[level] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {level.toUpperCase()}
    </span>
  )
}
