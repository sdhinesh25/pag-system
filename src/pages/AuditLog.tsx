// Phase 6 — Page 3: Audit Log (/audit)
import { useEffect, useState } from 'react'
import type { AuditEntry } from '../types'
import { getAuditLog } from '../api/reviews'
import { ApiError } from './AccountInventory'

const actionStyles: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800',
  REVOKED: 'bg-red-100 text-red-800',
  FLAGGED: 'bg-amber-100 text-amber-800',
  ESCALATED: 'bg-blue-100 text-blue-800',
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAuditLog()
      .then(setEntries)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Loading audit log…</p>
  if (error) return <ApiError message={error} />

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Audit Log</h2>
      <p className="mt-1 text-sm text-gray-500">{entries.length} entries</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...entries]
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{e.actor}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${actionStyles[e.action] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{e.target}</td>
                  <td className="px-4 py-3 text-gray-600">{e.justification}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
