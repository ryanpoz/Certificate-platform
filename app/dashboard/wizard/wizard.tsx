'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STARTER_TEMPLATES } from '@/lib/certificate-builder/starter-templates'
import { createCertificateFromWizard, parseCsvRecipients } from './actions'
import VisualEditor from '@/components/certificate/visual-editor'
import { type CertificateDesignV2 } from '@/lib/certificate-builder/design-v2'

interface WizardProps {
  academyId: string
  userId: string
  academyName: string
  userEmail: string
  userName: string
}

export default function CertificateWizard({ academyId, userId, academyName, userEmail, userName }: WizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Design
  const [selectedTemplate, setSelectedTemplate] = useState(STARTER_TEMPLATES[0])
  const [certificateName, setCertificateName] = useState('')
  const [description, setDescription] = useState('')
  const [programName, setProgramName] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [customDesign, setCustomDesign] = useState<any>(null)

  // Step 2: People
  const [recipients, setRecipients] = useState([{ name: userName, email: userEmail }])
  const [csvError, setCsvError] = useState('')

  // Step 3: Result
  const [result, setResult] = useState<any>(null)

  function addRecipient() {
    setRecipients([...recipients, { name: '', email: '' }])
  }

  function updateRecipient(index: number, field: 'name' | 'email', value: string) {
    const updated = [...recipients]
    updated[index][field] = value
    setRecipients(updated)
  }

  function removeRecipient(index: number) {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = await parseCsvRecipients(text)
      
      if (parsed.length === 0) {
        setCsvError('No valid recipients found in CSV')
        return
      }

      setRecipients(parsed)
      setCsvError('')
    } catch (error) {
      setCsvError('Failed to parse CSV file')
    }
  }

  function downloadSampleCsv() {
    const csv = 'Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-recipients.csv'
    a.click()
  }

  async function handleNext() {
    if (step === 1) {
      if (!certificateName.trim()) {
        alert('Please enter a certificate name')
        return
      }
      // Open editor for customization
      setShowEditor(true)
    } else if (step === 2) {
      const valid = recipients.every(r => r.name.trim() && r.email.trim() && r.email.includes('@'))
      if (!valid) {
        alert('Please fill in all recipient names and valid emails')
        return
      }
      setStep(3)
    }
  }

  async function handleEditorSave(design: CertificateDesignV2) {
    // Save the customized design and proceed to People step
    setCustomDesign(design)
    setShowEditor(false)
    setStep(2)
    return { success: true }
  }

  function skipCustomization() {
    // Skip editor and go straight to People with default template
    setShowEditor(false)
    setStep(2)
  }

  async function handleIssue() {
    setLoading(true)
    try {
      const res = await createCertificateFromWizard({
        academyId,
        userId,
        certificateName,
        templateConfig: customDesign || selectedTemplate.config,
        recipients,
        description,
        programName,
      })

      if (res.error) {
        alert(res.error)
        setLoading(false)
        return
      }

      setResult(res)
      setStep(4)
    } catch (error) {
      alert('Failed to create certificate')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Visual Editor Overlay */}
      {showEditor && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="max-w-7xl mx-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Customize your certificate</h2>
                <p className="text-gray-600 mt-1">
                  Design: {selectedTemplate.name} · Certificate: {certificateName}
                </p>
              </div>
              <button
                onClick={skipCustomization}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Skip customization →
              </button>
            </div>
            <VisualEditor
              templateId={selectedTemplate.id}
              initialDesign={customDesign || selectedTemplate.config}
              onSave={handleEditorSave}
            />
          </div>
        </div>
      )}

      {/* Stepper */}
      {!showEditor && (
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= s
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-sm text-gray-600">
            <div className="w-40 text-center">Design</div>
            <div className="w-40 text-center">People</div>
            <div className="w-40 text-center">Send</div>
          </div>
        </div>
      )}

      {/* Step 1: Design */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose a design</h2>
            <p className="text-gray-600">Pick a template to get started</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate name *
            </label>
            <input
              type="text"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="e.g. Motion Ads Certified"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {STARTER_TEMPLATES.map((template) => {
              // Use SVG preview from public/templates/
              const previewPath = `/templates/${template.id}.svg`
              
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors ${
                    selectedTemplate.id === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="aspect-[1.414] rounded mb-2 overflow-hidden bg-white border border-gray-200">
                    <img
                      src={previewPath}
                      alt={template.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.tags.slice(0, 2).join(', ')}</div>
                </button>
              )
            })}
          </div>

          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium">Optional details</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program name (if different)
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Leave blank to use certificate name"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this certificate"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next: Customize design
            </button>
          </div>
        </div>
      )}

      {/* Step 2: People */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Add recipients</h2>
            <p className="text-gray-600">Who should receive this certificate?</p>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Recipients</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadSampleCsv}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Download sample CSV
                </button>
                <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {csvError && (
              <div className="text-sm text-red-600 mb-2">{csvError}</div>
            )}

            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={recipient.name}
                  onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                  placeholder="Full name"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <input
                  type="email"
                  value={recipient.email}
                  onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                {recipients.length > 1 && (
                  <button
                    onClick={() => removeRecipient(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addRecipient}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add another recipient
            </button>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Send */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Review and send</h2>
            <p className="text-gray-600">Ready to issue these certificates?</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <div className="text-sm text-gray-600">Certificate</div>
              <div className="font-medium">{certificateName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Design</div>
              <div className="font-medium">{selectedTemplate.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Recipients</div>
              <div className="font-medium">{recipients.length} people</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-3">Recipients</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recipients.map((r, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b">
                  <span>{r.name}</span>
                  <span className="text-gray-600">{r.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleIssue}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Issuing...' : 'Issue & Send'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && result && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Certificates issued!</h2>
            <p className="text-gray-600">
              {result.issuedCertificates.length} certificate{result.issuedCertificates.length === 1 ? '' : 's'} created successfully
            </p>
          </div>

          {result.emailErrors && result.emailErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-1">Email delivery note</h4>
                  <p className="text-sm text-yellow-700">
                    Certificates were created successfully, but email delivery requires a verified sending domain. 
                    Recipients can access their certificates directly via the certificate links below. 
                    To enable email delivery, contact support to set up your domain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {result.issuedCertificates.length === 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Your certificate is ready!</h3>
              <a
                href={`/c/${result.issuedCertificates[0].number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-3"
              >
                View certificate
              </a>
              <p className="text-sm text-gray-600">
                Add it to your LinkedIn profile to increase your visibility
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/certificates')}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Go to certificates
            </button>
            <button
              onClick={() => {
                setStep(1)
                setCertificateName('')
                setDescription('')
                setProgramName('')
                setRecipients([{ name: userName, email: userEmail }])
                setResult(null)
              }}
              className="w-full px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              Create another certificate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
