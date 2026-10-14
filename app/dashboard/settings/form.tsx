'use client'

import { useState } from 'react'
import { updateAcademySettings } from './actions'

export default function SettingsForm({ academy }: { academy: any }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: academy.name || '',
    brandColor: academy.brandColor || '#2563eb',
    website: academy.website || '',
    senderName: academy.senderName || '',
    replyTo: academy.replyTo || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateAcademySettings(academy.id, formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    }
    
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Academy Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      </div>

      <div>
        <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700">
          Brand Color
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <input
            type="color"
            id="brandColor"
            value={formData.brandColor}
            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
            className="h-10 w-20 rounded border border-gray-300"
          />
          <input
            type="text"
            value={formData.brandColor}
            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
            className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            placeholder="#2563eb"
          />
        </div>
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website URL
        </label>
        <input
          type="url"
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
          Email Sender Name *
        </label>
        <input
          type="text"
          id="senderName"
          required
          value={formData.senderName}
          onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="Your Academy"
        />
      </div>

      <div>
        <label htmlFor="replyTo" className="block text-sm font-medium text-gray-700">
          Reply-To Email *
        </label>
        <input
          type="email"
          id="replyTo"
          required
          value={formData.replyTo}
          onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          placeholder="hello@example.com"
        />
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
