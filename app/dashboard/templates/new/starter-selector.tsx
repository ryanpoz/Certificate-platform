'use client'

import { useRouter } from 'next/navigation'
import { STARTER_TEMPLATES, type CertificateDesignConfig } from '@/lib/certificate-builder/types'
import { createTemplateFromStarterAction } from './actions'
import { useState } from 'react'

interface StarterTemplateSelectorProps {
  starterKey: string
  config: Partial<CertificateDesignConfig>
  academyId: string
}

const STARTER_INFO: Record<string, { name: string; description: string }> = {
  modern: {
    name: 'Modern',
    description: 'Clean sans-serif with bold accent bar',
  },
  classic: {
    name: 'Classic',
    description: 'Serif typography with ornamental border',
  },
  minimal: {
    name: 'Minimal',
    description: 'Lots of whitespace, small logo, left-aligned',
  },
  bold: {
    name: 'Bold',
    description: 'Full-bleed brand color with white text',
  },
}

export default function StarterTemplateSelector({ starterKey, config, academyId }: StarterTemplateSelectorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const info = STARTER_INFO[starterKey]

  async function handleSelect() {
    setLoading(true)
    try {
      const result = await createTemplateFromStarterAction(starterKey, academyId)
      if (result.success && result.templateId) {
        router.push(`/dashboard/templates/${result.templateId}`)
      } else {
        alert(result.error || 'Failed to create template')
      }
    } catch (error) {
      alert('Failed to create template')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleSelect}
      disabled={loading}
      className="text-left bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50"
    >
      <div className="aspect-[1.414/1] bg-gray-50 rounded mb-4 flex items-center justify-center" style={{ backgroundColor: config.colors?.background }}>
        <div className="text-center p-8" style={{ color: config.colors?.text }}>
          <div className="text-2xl font-bold mb-2" style={{ fontFamily: config.fonts?.heading }}>
            {config.layout?.titleText || 'Certificate'}
          </div>
          <div className="text-sm opacity-75" style={{ fontFamily: config.fonts?.body }}>
            Preview
          </div>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{info.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{info.description}</p>
      <div className="mt-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {loading ? 'Creating...' : 'Use this design'}
        </span>
      </div>
    </button>
  )
}
