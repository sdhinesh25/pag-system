// Phase 4 — Accounts API layer (backed by json-server on :3001).
import type { Account } from '../types'

const BASE = 'http://localhost:3001'

export async function getAccounts(): Promise<Account[]> {
  const res = await fetch(`${BASE}/accounts`)
  if (!res.ok) throw new Error(`Failed to load accounts (${res.status})`)
  return res.json()
}
