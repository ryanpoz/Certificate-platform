'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSingleCertificate } from '@/lib/import/actions'

export default function SingleCertificateForm({ course, academyId, userId }: { course: any; academyId: string; userId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueDate: new Date().toISOString().split('T')[0],
    custom: {} as Record<string, any>,
    publish: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const result = await createSingleCertificate(academyId, course.id, userId, {
        name: formData.name,
        email: formData.email,
        issueDate: new Date(formData.issueDate),
        custom: formData.custom,
        publish: formData.publish,
      })

      alert(`Certificate ${result.number} ${formData.publish ? 'published' : 'created as draft'}!`)
      router.push(`/dashboard/courses/${course.id}`)
    } catch (err) {
      setError(String(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Learner Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="Alex Johnson"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="alex@example.com"
        />
      </div>

      <div>
        <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
          Issue Date *
        </label>
        <input
          type="date"
          id="issueDate"
          required
          value={formData.issueDate}
          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="publish"
          checked={formData.publish}
          onChange={(e) => setFormData({ ...formData, publish: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="publish" className="ml-2 block text-sm text-gray-900">
          Publish immediately (send email)
        </label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Creating...' : formData.publish ? 'Create & Publish' : 'Save as Draft'}
        </button>
      </div>
    </form>
  )
}
