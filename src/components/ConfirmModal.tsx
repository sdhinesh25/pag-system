// Confirmation dialog with a justification textarea — theme-aware.
import { useState } from 'react'
import { Button } from './ui'

interface ConfirmModalProps {
  title: string
  confirmLabel?: string
  tone?: 'primary' | 'danger' | 'success'
  onConfirm: (justification: string) => void
  onClose: () => void
}

export default function ConfirmModal({
  title,
  confirmLabel = 'Confirm',
  tone = 'primary',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [justification, setJustification] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-strong">{title}</h3>
        <label className="mt-4 block text-sm font-medium text-muted">Justification</label>
        <textarea
          autoFocus
          rows={3}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Why are you making this decision?"
          className="mt-1 w-full rounded-lg border border-line-strong bg-canvas p-3 text-sm text-strong placeholder:text-subtle focus:border-accent focus:outline-none"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone}
            disabled={!justification.trim()}
            onClick={() => onConfirm(justification.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
