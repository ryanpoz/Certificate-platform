'use client'

import { useState } from 'react'
import { publishCertificates } from '@/lib/import/actions'

export default function PublishButton({ certificateIds }: { certificateIds: string[] }) {
  const [publishing, setPublishing] = useState(false)

  async function handlePublish() {
    if (!confirm(`Publish ${certificateIds.length} certificate${certificateIds.length !== 1 ? 's' : ''}? Emails will be sent (stubbed in Sprint 1).`)) {
      return
    }

    setPublishing(true)
    try {
      await publishCertificates(certificateIds)
      alert('Certificates published!')
      window.location.reload()
    } catch (error) {
      alert(`Failed to publish: ${error}`)
      setPublishing(false)
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={publishing}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
    >
      {publishing ? 'Publishing...' : `Publish ${certificateIds.length} Certificate${certificateIds.length !== 1 ? 's' : ''}`}
    </button>
  )
}
