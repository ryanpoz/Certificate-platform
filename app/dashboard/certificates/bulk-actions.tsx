'use client'

import { useState } from 'react'
import { publishCertificates } from '@/lib/import/actions'
import { revokeCertificates, exportCertificatesToCSV } from './actions'

export default function BulkActions({ 
  certificateIds, 
  hasUnpublished 
}: { 
  certificateIds: string[]
  hasUnpublished: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handlePublish() {
    if (!confirm(`Publish ${certificateIds.length} certificate${certificateIds.length !== 1 ? 's' : ''}? Emails will be sent.`)) {
      return
    }
    setLoading(true)
    try {
      await publishCertificates(certificateIds)
      alert('Certificates published!')
      window.location.reload()
    } catch (error) {
      alert(`Failed to publish: ${error}`)
    }
    setLoading(false)
  }

  async function handleRevoke() {
    const reason = prompt(`Revoke ${certificateIds.length} certificate${certificateIds.length !== 1 ? 's' : ''}?\n\nEnter reason for revocation:`)
    if (!reason) return

    setLoading(true)
    try {
      await revokeCertificates(certificateIds, reason)
      alert('Certificates revoked!')
      window.location.reload()
    } catch (error) {
      alert(`Failed to revoke: ${error}`)
    }
    setLoading(false)
  }

  async function handleExport() {
    setLoading(true)
    try {
      const csv = await exportCertificatesToCSV(certificateIds)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificates-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Failed to export: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Bulk Actions'}
        <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {hasUnpublished && (
                <button
                  onClick={handlePublish}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Publish Selected
                </button>
              )}
              <button
                onClick={handleRevoke}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Revoke Selected
              </button>
              <button
                onClick={handleExport}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export to CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
