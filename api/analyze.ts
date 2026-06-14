// Vercel serverless (Edge) function — proxies the AI Risk Analysis call to Anthropic.
// The API key lives in the server-side ANTHROPIC_KEY env var and is NEVER sent to the
// browser, so it can't be read from devtools. The client calls POST /api/analyze.
export const config = { runtime: 'edge' }

interface AccountPayload {
  username?: string
  accountType?: string
  riskLevel?: string
  pamStatus?: string
  daysSinceReview?: number
  isOrphaned?: boolean
  owner?: string | null
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const key = process.env.ANTHROPIC_KEY
  if (!key) return json({ error: 'Server is missing ANTHROPIC_KEY' }, 500)

  let a: AccountPayload
  try {
    a = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  // Build the prompt server-side so the client can't inject arbitrary instructions.
  const prompt = `You are a PAG security analyst. Analyze this privileged account and give exactly 2 sentences: first sentence is the risk summary, second sentence is the recommended action. Account: ${a.username}, Type: ${a.accountType}, Risk Level: ${a.riskLevel}, PAM Status: ${a.pamStatus}, Days Since Review: ${a.daysSinceReview}, Is Orphaned: ${a.isOrphaned}, Owner: ${a.owner ?? 'Unassigned'}. Be concise and professional.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return json({ error: `Anthropic returned ${res.status}` }, 502)
    const data = await res.json()
    const text: string = data?.content?.[0]?.text?.trim() ?? ''
    if (!text) return json({ error: 'Empty response' }, 502)
    return json({ text }, 200)
  } catch {
    return json({ error: 'Upstream request failed' }, 502)
  }
}
