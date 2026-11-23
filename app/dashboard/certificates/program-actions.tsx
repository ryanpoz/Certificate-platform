'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteCertificateProgram } from '@/app/dashboard/certificates/actions'

export function ProgramActions({
  courseId,
  academyId,
  name,
  issuedCount,
}: {
  courseId: string
  academyId: string
  name: string
  issuedCount: number
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const issuedNote =
      issuedCount > 0
        ? ` This will also permanently delete ${issuedCount} issued certificate${issuedCount === 1 ? '' : 's'}.`
        : ''
    if (
      !confirm(
        `Delete “${name || 'Untitled'}”?${issuedNote} This can’t be undone.`
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      const result = await deleteCertificateProgram(courseId, academyId)
      if (result.error) {
        alert(result.error)
        setDeleting(false)
        return
      }
      router.refresh()
    } catch {
      alert('Failed to delete certificate')
      setDeleting(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-4">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="text-blue-600 hover:text-blue-900"
      >
        View
      </Link>
      <Link
        href={`/dashboard/courses/${courseId}/issue`}
        className="text-blue-600 hover:text-blue-900"
      >
        Issue more
      </Link>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
