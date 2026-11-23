'use client'

import { useState } from 'react'
import { updateAcademySettings } from './actions'
import { PlanBadgeLink } from '@/components/dashboard/locked-feature'
import { BRAND } from '@/lib/config/brand'

export default function SettingsForm({ academy, canBrandEmail }: { academy: any; canBrandEmail: boolean }) {
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
      setMessage({
        type: 'success',
        text: result.emailBrandingLocked
          ? 'Settings saved. Email branding stays off until you upgrade to Starter.'
          : 'Settings saved successfully!',
      })
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

      <fieldset className="space-y-6" data-locked-feature={canBrandEmail ? undefined : 'brandedEmail'}>
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          Email branding {!canBrandEmail && <PlanBadgeLink feature="brandedEmail" />}
        </legend>
        {!canBrandEmail && (
          <p className="text-sm text-gray-600">
            On the Free plan, certificate emails are sent from {BRAND.name} with no custom reply-to.
            Your saved sender name and reply-to are kept and apply when you upgrade to Starter.
          </p>
        )}
      <div>
        <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
          Email Sender Name {canBrandEmail && '*'}
        </label>
        <input
          type="text"
          id="senderName"
          required={canBrandEmail}
          disabled={!canBrandEmail}
          value={formData.senderName}
          onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Your Academy"
        />
      </div>

      <div>
        <label htmlFor="replyTo" className="block text-sm font-medium text-gray-700">
          Reply-To Email {canBrandEmail && '*'}
        </label>
        <input
          type="email"
          id="replyTo"
          required={canBrandEmail}
          disabled={!canBrandEmail}
          value={formData.replyTo}
          onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="hello@example.com"
        />
      </div>
      </fieldset>

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
