// Phase 8 — ConfirmModal with a justification textarea.
import { useState } from 'react'

interface ConfirmModalProps {
  title: string
  confirmLabel?: string
  onConfirm: (justification: string) => void
  onClose: () => void
}

export default function ConfirmModal({
  title,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [justification, setJustification] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Justification
        </label>
        <textarea
          autoFocus
          rows={3}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Why are you making this decision?"
          className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={!justification.trim()}
            onClick={() => onConfirm(justification.trim())}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
