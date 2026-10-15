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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Logo</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={config.logo?.url || ''}
                onChange={(e) => setConfig({ ...config, logo: { ...config.logo, url: e.target.value, size: config.logo?.size || 'medium', position: config.logo?.position || 'top-center' }})}
                placeholder="Logo URL or data URL"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={config.logo?.size || 'medium'}
                  onChange={(e) => setConfig({ ...config, logo: { ...config.logo, size: e.target.value as any, url: config.logo?.url, position: config.logo?.position || 'top-center' }})}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                <select
                  value={config.logo?.position || 'top-center'}
                  onChange={(e) => setConfig({ ...config, logo: { ...config.logo, position: e.target.value as any, url: config.logo?.url, size: config.logo?.size || 'medium' }})}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Upload to Supabase Storage or use data URL for images &lt;500KB
              </p>
            </div>
          </div>

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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Background</h3>
            <div className="space-y-3">
              <select
                value={config.background.type}
                onChange={(e) => setConfig({ ...config, background: { ...config.background, type: e.target.value as any }})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="color">Solid Color</option>
                <option value="pattern">Pattern</option>
                <option value="image">Image</option>
              </select>
              {config.background.type === 'color' && (
                <input
                  type="color"
                  value={config.background.value}
                  onChange={(e) => setConfig({ ...config, background: { ...config.background, value: e.target.value }})}
                  className="w-full h-10 rounded border"
                />
              )}
              {config.background.type === 'image' && (
                <>
                  <input
                    type="text"
                    value={config.background.value}
                    onChange={(e) => setConfig({ ...config, background: { ...config.background, value: e.target.value }})}
                    placeholder="Background image URL or data URL"
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Opacity (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(config.background.opacity || 1) * 100}
                      onChange={(e) => setConfig({ ...config, background: { ...config.background, opacity: parseInt(e.target.value) / 100 }})}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">{Math.round((config.background.opacity || 1) * 100)}%</div>
                  </div>
                </>
              )}
              {config.background.type === 'pattern' && (
                <select
                  value={config.background.value}
                  onChange={(e) => setConfig({ ...config, background: { ...config.background, value: e.target.value }})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="dots">Dots</option>
                  <option value="grid">Grid</option>
                  <option value="diagonal">Diagonal Lines</option>
                  <option value="waves">Waves</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Border</h3>
            <div className="space-y-3">
              <select
                value={config.border.style}
                onChange={(e) => setConfig({ ...config, border: { ...config.border, style: e.target.value as any }})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="none">None</option>
                <option value="simple">Simple</option>
                <option value="double">Double</option>
                <option value="ornamental">Ornamental</option>
                <option value="modern">Modern</option>
              </select>
              {config.border.style !== 'none' && (
                <>
                  <input
                    type="color"
                    value={config.border.color}
                    onChange={(e) => setConfig({ ...config, border: { ...config.border, color: e.target.value }})}
                    className="w-full h-10 rounded border"
                  />
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={config.border.width}
                      onChange={(e) => setConfig({ ...config, border: { ...config.border, width: parseInt(e.target.value) }})}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">{config.border.width}px</div>
                  </div>
                </>
              )}
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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Signatures (up to 2)</h3>
            <div className="space-y-4">
              {config.signatures.map((sig, idx) => (
                <div key={idx} className="p-3 border rounded bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Signature {idx + 1}</span>
                    <button
                      onClick={() => setConfig({ ...config, signatures: config.signatures.filter((_, i) => i !== idx) })}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <select
                    value={sig.type}
                    onChange={(e) => {
                      const newSigs = [...config.signatures]
                      newSigs[idx] = { ...sig, type: e.target.value as any }
                      setConfig({ ...config, signatures: newSigs })
                    }}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="text">Typed Name</option>
                    <option value="image">Uploaded Image</option>
                  </select>
                  {sig.type === 'text' ? (
                    <>
                      <input
                        type="text"
                        value={sig.value}
                        onChange={(e) => {
                          const newSigs = [...config.signatures]
                          newSigs[idx] = { ...sig, value: e.target.value }
                          setConfig({ ...config, signatures: newSigs })
                        }}
                        placeholder="Signature name"
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <select
                        value={sig.font || 'Allura'}
                        onChange={(e) => {
                          const newSigs = [...config.signatures]
                          newSigs[idx] = { ...sig, font: e.target.value }
                          setConfig({ ...config, signatures: newSigs })
                        }}
                        className="w-full px-3 py-2 border rounded text-sm"
                      >
                        <option value="Allura">Allura (script)</option>
                        <option value="Dancing Script">Dancing Script</option>
                        <option value="Great Vibes">Great Vibes</option>
                        <option value="Pacifico">Pacifico</option>
                      </select>
                    </>
                  ) : (
                    <input
                      type="text"
                      value={sig.value}
                      onChange={(e) => {
                        const newSigs = [...config.signatures]
                        newSigs[idx] = { ...sig, value: e.target.value }
                        setConfig({ ...config, signatures: newSigs })
                      }}
                      placeholder="Signature image URL or data URL"
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  )}
                  <input
                    type="text"
                    value={sig.title}
                    onChange={(e) => {
                      const newSigs = [...config.signatures]
                      newSigs[idx] = { ...sig, title: e.target.value }
                      setConfig({ ...config, signatures: newSigs })
                    }}
                    placeholder="Title (e.g. Director, CEO)"
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              ))}
              {config.signatures.length < 2 && (
                <button
                  onClick={() => setConfig({ ...config, signatures: [...config.signatures, { type: 'text', value: '', title: '' }] })}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
                >
                  + Add Signature
                </button>
              )}
            </div>
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
            className="w-full max-w-4xl aspect-[1.414/1] bg-white shadow-xl relative overflow-hidden"
            style={{ 
              backgroundColor: config.background.type === 'color' ? config.background.value : config.colors.background,
              backgroundImage: config.background.type === 'image' && config.background.value ? `url(${config.background.value})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: config.colors.text,
            }}
          >
            {config.background.type === 'image' && config.background.value && (
              <div 
                className="absolute inset-0 bg-white" 
                style={{ opacity: 1 - (config.background.opacity || 1) }}
              />
            )}
            
            <div className="relative h-full p-12">
              {config.border.style !== 'none' && (
                <div 
                  className="absolute inset-4 pointer-events-none"
                  style={{
                    border: `${config.border.width}px ${config.border.style === 'double' ? 'double' : 'solid'} ${config.border.color}`,
                    borderRadius: config.border.style === 'modern' ? '8px' : '0',
                  }}
                />
              )}
              
              {config.logo?.url && (
                <div 
                  className={`absolute ${
                    config.logo.position === 'top-left' ? 'top-8 left-8' :
                    config.logo.position === 'top-right' ? 'top-8 right-8' :
                    'top-8 left-1/2 -translate-x-1/2'
                  }`}
                  style={{
                    width: config.logo.size === 'small' ? '60px' : config.logo.size === 'large' ? '120px' : '90px',
                    height: config.logo.size === 'small' ? '60px' : config.logo.size === 'large' ? '120px' : '90px',
                  }}
                >
                  <img src={config.logo.url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              
              <div className={`relative h-full flex flex-col ${config.layout.alignment === 'center' ? 'items-center text-center' : 'items-start text-left'}`} style={{ paddingTop: config.logo?.url ? '80px' : '0' }}>
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

                {config.signatures.length > 0 && (
                  <div className={`mt-8 grid ${config.signatures.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-8 w-full`}>
                    {config.signatures.map((sig, idx) => (
                      <div key={idx} className="text-center">
                        {sig.type === 'text' ? (
                          <div
                            className="text-3xl mb-2"
                            style={{ fontFamily: sig.font || 'Allura' }}
                          >
                            {sig.value || 'Signature'}
                          </div>
                        ) : sig.value ? (
                          <img src={sig.value} alt={`Signature ${idx + 1}`} className="h-16 mx-auto mb-2" />
                        ) : (
                          <div className="h-16 bg-gray-200 rounded mb-2 flex items-center justify-center text-xs text-gray-400">
                            Signature Image
                          </div>
                        )}
                        <div className="text-sm font-medium">{sig.value || `Signatory ${idx + 1}`}</div>
                        <div className="text-xs text-gray-600">{sig.title || 'Title'}</div>
                      </div>
                    ))}
                  </div>
                )}

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
    </div>
  )
}
