'use client'

import { useState, useRef } from 'react'
import { processImage, validateImageFile, isSupabaseConfigured, type ImageProcessingOptions } from '@/lib/utils/image-processing'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label: string
  maxWidth: number
  accept?: string
  helpText?: string
}

export default function ImageUpload({ 
  value, 
  onChange, 
  label, 
  maxWidth,
  accept = 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml',
  helpText 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    try {
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        setUploading(false)
        return
      }

      const options: ImageProcessingOptions = {
        maxWidth,
        quality: 0.85,
        format: file.type.includes('png') ? 'png' : 'jpeg',
      }

      const dataUrl = await processImage(file, options)
      onChange(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  function handleUrlSubmit() {
    if (urlValue.trim()) {
      onChange(urlValue.trim())
      setUrlValue('')
      setShowUrlInput(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
            <img 
              src={value} 
              alt={label}
              className="max-h-32 mx-auto object-contain"
            />
            <button
              onClick={() => onChange('')}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Change image
          </button>
        </div>
      ) : (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {uploading ? (
              <div className="text-sm text-gray-600">Processing...</div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-sm text-gray-600">
                  Click or drag image here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WebP, SVG up to 10MB
                </p>
              </>
            )}
          </div>
          
          {!showUrlInput ? (
            <button
              onClick={() => setShowUrlInput(true)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Or paste a URL
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/image.png"
                className="flex-1 px-3 py-2 border rounded text-sm"
              />
              <button
                onClick={handleUrlSubmit}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlValue('')
                }}
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {!isSupabaseConfigured() && (
        <p className="text-xs text-gray-500">
          Images stored as data URLs. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for cloud storage.
        </p>
      )}
    </div>
  )
}
