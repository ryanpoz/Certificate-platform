'use client'

import { useState } from 'react'
import { updateTemplate } from '../actions'
import { renderMergeFields } from '@/lib/utils/helpers'

export default function TemplateEditor({ course, template }: { course: any; template: any }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    bodyText: template?.bodyText || '',
    emailSubject: template?.emailSubject || '',
    emailBody: template?.emailBody || '',
  })

  const dummyData = {
    learnerName: 'Alex Johnson',
    courseName: course.name,
    issueDate: new Date(),
    expiryDate: course.validityMonths ? new Date(Date.now() + course.validityMonths * 30 * 24 * 60 * 60 * 1000) : null,
    certificateNumber: 'MTN-7F3Q-92XD',
    custom: {},
  }

  const previewText = renderMergeFields(formData.bodyText, dummyData)
  const previewEmail = renderMergeFields(formData.emailBody, dummyData)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!template) return
    
    setSaving(true)
    setMessage(null)

    const result = await updateTemplate(template.id, formData)
    
    setMessage({ type: 'success', text: 'Template saved successfully!' })
    setEditing(false)
    
    setSaving(false)
  }

  if (!template) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Certificate Template</h2>
          <p className="mt-2 text-sm text-gray-500">No template configured for this course.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Certificate Template</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit Template
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded">
          <strong>Available merge fields:</strong> {'{'}{'{'} learner.name {'}'}{'}'},
          {' '}{'{'}{'{'} course.name {'}'}{'}'},
          {' '}{'{'}{'{'} issue_date {'}'}{'}'},
          {' '}{'{'}{'{'} expiry_date {'}'}{'}'},
          {' '}{'{'}{'{'} certificate.number {'}'}{'}'} 
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700">
                Certificate Body Text
              </label>
              <textarea
                id="bodyText"
                rows={8}
                value={formData.bodyText}
                onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border font-mono"
              />
            </div>

            <div>
              <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">
                Email Subject
              </label>
              <input
                type="text"
                id="emailSubject"
                value={formData.emailSubject}
                onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700">
                Email Body
              </label>
              <textarea
                id="emailBody"
                rows={6}
                value={formData.emailBody}
                onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border font-mono"
              />
            </div>

            {message && (
              <div className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview (with dummy data)</h3>
              <div className="bg-white p-8 rounded shadow-sm border-2 border-gray-300 whitespace-pre-wrap">
                {previewText}
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Email Preview</h3>
              <div className="bg-white p-6 rounded shadow-sm border">
                <div className="mb-4 pb-3 border-b">
                  <strong>Subject:</strong> {renderMergeFields(formData.emailSubject, dummyData)}
                </div>
                <div className="whitespace-pre-wrap">
                  {previewEmail}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
