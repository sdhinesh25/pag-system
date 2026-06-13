// Risk-level badge — theme-aware. (Kept for back-compat; prefer RiskPill from ui.tsx.)
import { RiskPill } from './ui'
import type { RiskLevel } from '../types'

export default function Badge({ level }: { level: RiskLevel }) {
  return <RiskPill level={level} />
}
