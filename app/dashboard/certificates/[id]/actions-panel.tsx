'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { editCertificate, reissueCertificate, revokeSingleCertificate, discardPendingChanges, republishCertificate } from '../actions'
import { publishCertificates } from '@/lib/import/actions'

export default function CertificateActions({
  certificateId,
  status,
  learnerName,
  issueDate,
  custom,
  pendingChanges,
}: {
  certificateId: string
  status: string
  learnerName: string
  issueDate: Date
  custom: Record<string, any>
  pendingChanges: any
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const displayData = pendingChanges || {
    learnerName,
    issueDate: new Date(issueDate).toISOString().split('T')[0],
    custom,
  }
  
  const [formData, setFormData] = useState({
    learnerName: displayData.learnerName,
    issueDate: typeof displayData.issueDate === 'string' 
      ? displayData.issueDate 
      : new Date(displayData.issueDate).toISOString().split('T')[0],
    custom: displayData.custom || {},
  })

  async function handleEdit() {
    setLoading(true)
    try {
      const result = await editCertificate(certificateId, {
        learnerName: formData.learnerName,
        issueDate: new Date(formData.issueDate),
        custom: formData.custom,
      })
      
      if (result.pendingChanges) {
        alert('Changes saved as pending. Republish to make them visible on the public page.')
      } else {
        alert('Certificate updated!')
      }
      
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      alert(`Failed to update: ${error}`)
    }
    setLoading(false)
  }

  async function handleRepublish() {
    const sendEmail = confirm('Republish with pending changes?\n\nClick OK to republish and send email, or Cancel to republish without sending email.')
    
    setLoading(true)
    try {
      await republishCertificate(certificateId, sendEmail)
      alert(sendEmail ? 'Certificate republished and email sent!' : 'Certificate republished!')
      router.refresh()
    } catch (error) {
      alert(`Failed to republish: ${error}`)
    }
    setLoading(false)
  }

  async function handleDiscardChanges() {
    if (!confirm('Discard all pending changes?')) {
      return
    }
    
    setLoading(true)
    try {
      await discardPendingChanges(certificateId)
      alert('Pending changes discarded.')
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      alert(`Failed to discard: ${error}`)
    }
    setLoading(false)
  }

  async function handleReissue() {
    if (!confirm('Create a new certificate for this learner? The current certificate will remain unchanged.')) {
      return
    }
    setLoading(true)
    try {
      const result = await reissueCertificate(certificateId)
      alert(`New certificate created: ${result.number}`)
      router.push(`/dashboard/certificates/${result.certificateId}`)
    } catch (error) {
      alert(`Failed to reissue: ${error}`)
    }
    setLoading(false)
  }

  async function handleRevoke() {
    const reason = prompt('Enter reason for revocation:')
    if (!reason) return

    setLoading(true)
    try {
      await revokeSingleCertificate(certificateId, reason)
      alert('Certificate revoked!')
      router.refresh()
    } catch (error) {
      alert(`Failed to revoke: ${error}`)
    }
    setLoading(false)
  }

  async function handlePublish() {
    if (!confirm('Publish this certificate? An email will be sent to the learner.')) {
      return
    }
    setLoading(true)
    try {
      await publishCertificates([certificateId])
      alert('Certificate published!')
      router.refresh()
    } catch (error) {
      alert(`Failed to publish: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>

        {pendingChanges && !isEditing && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">Pending Changes</span>
            </div>
            <p className="text-xs text-yellow-700">
              This certificate has unpublished edits. Republish to make them visible on the public page.
            </p>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learner Name
              </label>
              <input
                type="text"
                value={formData.learnerName}
                onChange={(e) => setFormData({ ...formData, learnerName: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {status === 'unpublished' && (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                Publish
              </button>
            )}
            {pendingChanges && status === 'published' && (
              <>
                <button
                  onClick={handleRepublish}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  Republish
                </button>
                <button
                  onClick={handleDiscardChanges}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-orange-300 shadow-sm text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 disabled:opacity-50"
                >
                  Discard Changes
                </button>
              </>
            )}
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading || status === 'revoked'}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={handleReissue}
              disabled={loading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Reissue
            </button>
            {status !== 'revoked' && (
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                Revoke
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
