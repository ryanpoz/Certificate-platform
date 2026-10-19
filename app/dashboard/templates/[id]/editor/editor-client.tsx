'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import VisualEditor from '@/components/certificate/visual-editor'
import { saveTemplateDesign } from './actions'

interface EditorPageProps {
  templateId: string
  initialDesign: any
}

export default function EditorPageClient({ templateId, initialDesign }: EditorPageProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSave(design: any) {
    setSaving(true)
    try {
      const result = await saveTemplateDesign(templateId, design)
      if (result.error) {
        alert(result.error)
      } else {
        router.push(`/dashboard/templates/${templateId}`)
      }
    } catch (error) {
      alert('Failed to save design')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen">
      {saving && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50">
          Saving...
        </div>
      )}
      <VisualEditor
        initialDesign={initialDesign}
        onSave={handleSave}
      />
    </div>
  )
}
