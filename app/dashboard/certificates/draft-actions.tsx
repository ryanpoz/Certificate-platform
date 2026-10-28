'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteDraft } from '@/app/dashboard/wizard/actions'

export function DraftActions({
  draftId,
  academyId,
  name,
}: {
  draftId: string
  academyId: string
  name: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete draft “${name || 'Untitled'}”? This can’t be undone.`)) {
      return
    }
    setDeleting(true)
    try {
      const result = await deleteDraft(draftId, academyId)
      if (result.error) {
        alert(result.error)
        setDeleting(false)
        return
      }
      router.refresh()
    } catch {
      alert('Failed to delete draft')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-4 shrink-0">
      <Link
        href={`/dashboard/wizard?draft=${draftId}`}
        className="text-blue-600 hover:text-blue-900 font-medium text-sm whitespace-nowrap"
      >
        Continue editing
      </Link>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="text-red-600 hover:text-red-800 font-medium text-sm whitespace-nowrap disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
