'use client'

import { useState, useTransition } from 'react'
import { setCourseReminders } from '../actions'

export default function RemindersToggle({
  courseId,
  initialEnabled,
  hasExpiry,
}: {
  courseId: string
  initialEnabled: boolean
  hasExpiry: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !enabled
    setError(null)
    startTransition(async () => {
      const result = await setCourseReminders(courseId, next)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        return
      }
      setEnabled(next)
    })
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={toggle} disabled={pending} className="h-4 w-4 rounded border-gray-300" />
        <span>{enabled ? 'On' : 'Off'}: email recipients 30 and 7 days before their certificate expires</span>
      </label>
      {!hasExpiry && <p className="mt-1 text-xs text-gray-500">This program has no default validity, so only certificates given their own expiry date get reminders.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
