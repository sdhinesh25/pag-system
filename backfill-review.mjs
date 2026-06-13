// One-time data hygiene: recompute stored daysSinceReview + reviewDue from
// lastReviewed so the raw table matches what the app derives. Run once, then delete.
const URL = 'https://eevsnoycvtlcaxhwncky.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldnNub3ljdnRsY2F4aHduY2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjE0ODEsImV4cCI6MjA5NjYzNzQ4MX0.zICszEkhvUtyqPxp0SAtR4cXzt4peuShEoRSYBAdYho'
const DAY = 86_400_000
const CYCLE = 180
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const now = Date.now()
const accts = await (await fetch(`${URL}/rest/v1/accounts?select=id,lastReviewed,daysSinceReview,reviewDue`, { headers: H })).json()

for (const a of accts) {
  const t = Date.parse(a.lastReviewed)
  const daysSinceReview = Math.max(0, Math.floor((now - t) / DAY))
  const reviewDue = new Date(t + CYCLE * DAY).toISOString().slice(0, 10)
  const res = await fetch(`${URL}/rest/v1/accounts?id=eq.${a.id}`, {
    method: 'PATCH',
    headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ daysSinceReview, reviewDue }),
  })
  console.log(`${a.id}: ${a.daysSinceReview}->${daysSinceReview}d, due ${a.reviewDue}->${reviewDue}  [${res.status}]`)
}
console.log('done')
