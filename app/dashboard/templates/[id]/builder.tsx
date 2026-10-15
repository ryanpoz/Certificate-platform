'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type CertificateDesignConfig, FONT_PAIRS, MERGE_FIELDS, getDefaultDesignConfig, renderMergeFields } from '@/lib/certificate-builder/types'
import { updateTemplateAction } from './actions'

interface TemplateBuilderProps {
  template: any
  academyId: string
}

export default function TemplateBuilder({ template, academyId }: TemplateBuilderProps) {
  const router = useRouter()
  const [name, setName] = useState(template.name)
  const [config, setConfig] = useState<CertificateDesignConfig>(
    template.designConfig || getDefaultDesignConfig()
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateTemplateAction(template.id, {
        name,
        designConfig: config,
        bodyText: config.bodyText,
      })
      if (result.success) {
        alert('Template saved successfully!')
        router.refresh()
      } else {
        alert(result.error || 'Failed to save template')
      }
    } catch (error) {
      alert('Failed to save template')
    }
    setSaving(false)
  }

  const sampleData = {
    recipientName: 'Jane Smith',
    programName: 'Advanced Product Certification',
    issueDate: 'December 15, 2026',
    expiryDate: null,
    certificateNumber: 'CERT-2026-001',
    academyName: 'Academy',
  }

  const renderedText = renderMergeFields(config.bodyText, sampleData)

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Colors</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Primary Color</label>
                <input
                  type="color"
                  value={config.colors.primary}
                  onChange={(e) => setConfig({ ...config, colors: { ...config.colors, primary: e.target.value }})}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Accent Color</label>
                <input
                  type="color"
                  value={config.colors.accent}
                  onChange={(e) => setConfig({ ...config, colors: { ...config.colors, accent: e.target.value }})}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                <input
                  type="color"
                  value={config.colors.background}
                  onChange={(e) => setConfig({ ...config, colors: { ...config.colors, background: e.target.value }})}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                <input
                  type="color"
                  value={config.colors.text}
                  onChange={(e) => setConfig({ ...config, colors: { ...config.colors, text: e.target.value }})}
                  className="w-full h-10 rounded border"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Typography</h3>
            <select
              value={config.fonts.pair}
              onChange={(e) => {
                const pair = FONT_PAIRS.find(p => p.id === e.target.value)
                if (pair) {
                  setConfig({
                    ...config,
                    fonts: {
                      heading: pair.heading,
                      body: pair.body,
                      pair: pair.id as any,
                    }
                  })
                }
              }}
              className="w-full px-3 py-2 border rounded"
            >
              {FONT_PAIRS.map(pair => (
                <option key={pair.id} value={pair.id}>
                  {pair.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Title</h3>
            <input
              type="text"
              value={config.layout.titleText}
              onChange={(e) => setConfig({ ...config, layout: { ...config.layout, titleText: e.target.value }})}
              className="w-full px-3 py-2 border rounded"
              placeholder="Certificate of Completion"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Body Text</h3>
            <div className="mb-2 flex flex-wrap gap-1">
              {MERGE_FIELDS.map(field => (
                <button
                  key={field.key}
                  onClick={() => setConfig({ ...config, bodyText: config.bodyText + ' ' + field.key })}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  title={`Insert ${field.label}`}
                >
                  {field.label}
                </button>
              ))}
            </div>
            <textarea
              value={config.bodyText}
              onChange={(e) => setConfig({ ...config, bodyText: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              placeholder="Certificate body text with merge fields"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showQrCode}
                  onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show QR Code</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showCertNumber}
                  onChange={(e) => setConfig({ ...config, showCertNumber: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show Certificate Number</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showExpiryDate}
                  onChange={(e) => setConfig({ ...config, showExpiryDate: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show Expiry Date</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 p-8 overflow-auto flex items-center justify-center">
          <div 
            className="w-full max-w-4xl aspect-[1.414/1] bg-white shadow-xl p-12 relative"
            style={{ 
              backgroundColor: config.colors.background,
              color: config.colors.text,
            }}
          >
            {config.border.style !== 'none' && (
              <div 
                className="absolute inset-4 pointer-events-none"
                style={{
                  border: `${config.border.width}px ${config.border.style === 'double' ? 'double' : 'solid'} ${config.border.color}`,
                  borderRadius: config.border.style === 'modern' ? '8px' : '0',
                }}
              />
            )}
            
            <div className={`relative h-full flex flex-col ${config.layout.alignment === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
              <div className="mb-8">
                <h1 
                  className="text-4xl font-bold"
                  style={{ 
                    fontFamily: config.fonts.heading,
                    color: config.colors.primary,
                  }}
                >
                  {config.layout.titleText}
                </h1>
              </div>

              <div className="flex-1 flex items-center">
                <p 
                  className="text-lg whitespace-pre-line"
                  style={{ fontFamily: config.fonts.body }}
                >
                  {renderedText}
                </p>
              </div>

              <div className="mt-auto pt-8 flex justify-between items-end w-full text-sm">
                {config.showCertNumber && (
                  <div>Certificate No: {sampleData.certificateNumber}</div>
                )}
                {config.showExpiryDate && sampleData.expiryDate && (
                  <div>Expires: {sampleData.expiryDate}</div>
                )}
                {config.showQrCode && (
                  <div className="w-16 h-16 bg-gray-200 rounded" title="QR Code"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
