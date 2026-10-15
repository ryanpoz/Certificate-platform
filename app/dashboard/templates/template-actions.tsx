'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { duplicateTemplateAction, deleteTemplateAction, setDefaultTemplateAction, renameTemplateAction } from './actions'

interface TemplateActionsProps {
  templateId: string
  templateName: string
  isDefault: boolean
  isInUse: boolean
  academyId: string
}

export default function TemplateActions({ 
  templateId, 
  templateName, 
  isDefault, 
  isInUse,
  academyId 
}: TemplateActionsProps) {
  const router = useRouter()
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState(templateName)
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    try {
      const result = await duplicateTemplateAction(templateId, academyId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('Failed to duplicate template')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${templateName}"?`)) return
    
    setLoading(true)
    try {
      const result = await deleteTemplateAction(templateId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('Failed to delete template')
    }
    setLoading(false)
  }

  async function handleSetDefault() {
    setLoading(true)
    try {
      const result = await setDefaultTemplateAction(templateId, academyId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('Failed to set as default')
    }
    setLoading(false)
  }

  async function handleRename() {
    if (!newName.trim()) return
    
    setLoading(true)
    try {
      const result = await renameTemplateAction(templateId, newName)
      if (result.success) {
        setShowRename(false)
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('Failed to rename template')
    }
    setLoading(false)
  }

  if (showRename) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-1.5 border"
          placeholder="Template name"
        />
        <button
          onClick={handleRename}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => {
            setShowRename(false)
            setNewName(templateName)
          }}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => setShowRename(true)}
        disabled={loading}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Rename
      </button>
      <button
        onClick={handleDuplicate}
        disabled={loading}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Duplicate
      </button>
      {!isDefault && (
        <button
          onClick={handleSetDefault}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Set as default
        </button>
      )}
      {!isInUse && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  )
}
