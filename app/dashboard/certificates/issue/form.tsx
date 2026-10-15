'use client'

import { useState } from 'react'
import { issueSingleCertificateAction } from './actions'

interface Program {
  id: string
  name: string
  code: string
  description: string | null
  validityMonths: number | null
  ctaLabel: string | null
  ctaUrl: string | null
  templateId: string | null
}

interface IssueCertificateFormProps {
  programs: Program[]
  defaultTemplateId: string
  academyId: string
  userId: string
}

export default function IssueCertificateForm({ programs, defaultTemplateId, academyId, userId }: IssueCertificateFormProps) {
  const [formData, setFormData] = useState({
    learnerName: '',
    learnerEmail: '',
    issueDate: new Date().toISOString().split('T')[0],
    programId: '',
    newProgramName: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isCreatingProgram, setIsCreatingProgram] = useState(programs.length === 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const result = await issueSingleCertificateAction({
        learnerName: formData.learnerName,
        learnerEmail: formData.learnerEmail,
        issueDate: formData.issueDate,
        programId: isCreatingProgram ? undefined : formData.programId,
        newProgramName: isCreatingProgram ? formData.newProgramName : undefined,
        defaultTemplateId,
        academyId,
        userId,
      })

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Certificate issued successfully! ${result.certificateUrl ? `View at ${result.certificateUrl}` : ''}` })
        setFormData({
          learnerName: '',
          learnerEmail: '',
          issueDate: new Date().toISOString().split('T')[0],
          programId: isCreatingProgram ? '' : formData.programId,
          newProgramName: '',
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to issue certificate. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificate Program
        </label>
        
        <div className="space-y-3">
          {programs.length > 0 && !isCreatingProgram && (
            <>
              <select
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                required={!isCreatingProgram}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCreatingProgram(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Create new program
              </button>
            </>
          )}

          {isCreatingProgram && (
            <>
              <input
                type="text"
                value={formData.newProgramName}
                onChange={(e) => setFormData({ ...formData, newProgramName: e.target.value })}
                required={isCreatingProgram}
                placeholder="Program name (e.g. Product Certification)"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
              {programs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProgram(false)
                    setFormData({ ...formData, newProgramName: '' })
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Use existing program
                </button>
              )}
              <p className="text-xs text-gray-500">
                A new program will be created with default settings (default template, no expiry, academy CTA)
              </p>
            </>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="learnerName" className="block text-sm font-medium text-gray-700 mb-1">
          Learner Name
        </label>
        <input
          type="text"
          id="learnerName"
          value={formData.learnerName}
          onChange={(e) => setFormData({ ...formData, learnerName: e.target.value })}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label htmlFor="learnerEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Learner Email
        </label>
        <input
          type="email"
          id="learnerEmail"
          value={formData.learnerEmail}
          onChange={(e) => setFormData({ ...formData, learnerEmail: e.target.value })}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
          Issue Date
        </label>
        <input
          type="date"
          id="issueDate"
          value={formData.issueDate}
          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Issuing...' : 'Issue Certificate'}
      </button>
    </form>
  )
}
