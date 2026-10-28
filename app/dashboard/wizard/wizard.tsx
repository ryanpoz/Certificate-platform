'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCertificateFromWizard, parseCsvRecipients, saveDraft, loadDraft } from './actions'
import FabricEditorClient from '@/components/certificate/fabric-editor-client'
import type { DesignConfigV3 } from '@/lib/design-config/v3-schema'
import { createBlankLandscapeTemplate } from '@/app/dashboard/lab/fabric/blank-template'

interface WizardProps {
  academyId: string
  userId: string
  academyName: string
  userEmail: string
  userName: string
  draftId?: string
}

export default function CertificateWizard({ academyId, userId, academyName, userEmail, userName, draftId: initialDraftId }: WizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [draftId, setDraftId] = useState(initialDraftId)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  // Step 1: Design (Fabric start-screen catalog + editor)
  const [certificateName, setCertificateName] = useState('')
  const [description, setDescription] = useState('')
  const [programName, setProgramName] = useState('')
  const [customDesign, setCustomDesign] = useState<DesignConfigV3 | null>(null)
  const [hasEdits, setHasEdits] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  // Step 2: People
  const [recipients, setRecipients] = useState([{ name: userName, email: userEmail }])
  const [csvError, setCsvError] = useState('')

  // Step 3: Result
  const [result, setResult] = useState<any>(null)

  // Load draft on mount
  useEffect(() => {
    if (initialDraftId) {
      loadDraft(initialDraftId).then((res) => {
        if (res.success && res.draft) {
          const draft = res.draft as any
          setCertificateName(draft.certificateName || '')
          setDescription(draft.description || '')
          setProgramName(draft.programName || '')
          setStep(draft.currentStep || 1)
          setRecipients(draft.recipients || [{ name: userName, email: userEmail }])
          // Only restore Fabric v3 designs; v2 drafts start fresh on the start screen
          if (draft.templateConfig?.version === 3) {
            setCustomDesign(draft.templateConfig as DesignConfigV3)
            setEditorKey(k => k + 1)
          }
        }
      })
    }
  }, [initialDraftId, userName, userEmail])

  // Autosave draft every 10 seconds if there are changes
  useEffect(() => {
    if (!certificateName) return // Don't autosave until name is set
    
    const timer = setTimeout(async () => {
      if (hasEdits || certificateName) {
        await handleSaveDraft(true)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [certificateName, customDesign, description, programName, recipients, step, hasEdits])

  async function handleSaveDraft(isAutosave = false) {
    if (!isAutosave) setSavingDraft(true)
    setDraftSaved(false)

    const result = await saveDraft({
      academyId,
      userId,
      draftId,
      certificateName: certificateName || 'Untitled Certificate',
      templateConfig: customDesign || createBlankLandscapeTemplate(),
      currentStep: step,
      recipients,
      description,
      programName,
      selectedTemplateId: 'fabric-v3',
    })

    if (result.success && result.draftId) {
      setDraftId(result.draftId)
      setDraftSaved(true)
      setHasEdits(false)
      
      // Update URL to include draft ID if not already there
      if (!initialDraftId && result.draftId) {
        window.history.replaceState({}, '', `/dashboard/wizard?draft=${result.draftId}`)
      }

      if (!isAutosave) {
        setTimeout(() => setDraftSaved(false), 3000)
      }
    }

    if (!isAutosave) setSavingDraft(false)
  }

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

  async function handleEditorSave(design: DesignConfigV3) {
    setCustomDesign(design)
    setHasEdits(true)
  }

  function handleNextToPeople(e: React.FormEvent) {
    e.preventDefault() // Prevent form submission
    if (!certificateName.trim()) {
      alert('Please enter a certificate name')
      return
    }
    if (!customDesign) {
      alert('Please choose a template or start blank before continuing')
      return
    }
    setStep(2)
  }

  function handleNextToReview(e: React.FormEvent) {
    e.preventDefault()
    const valid = recipients.every(r => r.name.trim() && r.email.trim() && r.email.includes('@'))
    if (!valid) {
      alert('Please fill in all recipient names and valid emails')
      return
    }
    setStep(3)
  }

  async function handleIssue() {
    setLoading(true)
    try {
      const res = await createCertificateFromWizard({
        academyId,
        userId,
        certificateName,
        templateConfig: customDesign || createBlankLandscapeTemplate(),
        recipients,
        description,
        programName,
        draftId,
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
    <div className="max-w-full mx-auto px-4 py-8">
      {/* Stepper */}
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
          <div className="w-40 text-center">Design Certificate</div>
          <div className="w-40 text-center">Add Recipients</div>
          <div className="w-40 text-center">Test and Send</div>
        </div>
      </div>

      {/* Step 1: Design Certificate (Fabric start-screen catalog + Full-Width Editor) */}
      {step === 1 && (
        <div className="flex flex-col h-[calc(100vh-160px)] min-h-[700px]">
          {/* Top Bar: Name + Next + Save Draft */}
          <div className="flex items-center gap-4 p-4 border-b bg-white">
            {/* Certificate Name */}
            <div className="w-64 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Certificate name *
              </label>
              <input
                type="text"
                value={certificateName}
                onChange={(e) => {
                  setCertificateName(e.target.value)
                  setHasEdits(true)
                }}
                placeholder="e.g. Motion Ads Certified"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
            </div>

            <div className="flex-1 min-w-0 text-sm text-gray-500">
              Pick a blank page or template in the editor, then customize with Text, Uploads, and Background.
            </div>

            {/* Save Draft Button */}
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-transparent mb-1">
                Save
              </label>
              <button
                onClick={() => handleSaveDraft(false)}
                disabled={savingDraft || !certificateName}
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingDraft ? 'Saving...' : draftSaved ? '✓ Saved' : 'Save Draft'}
              </button>
            </div>

            {/* Next Button */}
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-transparent mb-1">
                Action
              </label>
              <button
                onClick={handleNextToPeople}
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
              >
                Next: Add Recipients →
              </button>
            </div>
          </div>

          {/* Full-Width Fabric Editor */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <FabricEditorClient
              key={editorKey}
              mode="wizard"
              initialConfig={customDesign}
              onSave={handleEditorSave}
            />
          </div>
        </div>
      )}

      {/* Step 2: Add Recipients */}
      {step === 2 && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Add Recipients</h2>
            <p className="text-gray-600">Who should receive this certificate?</p>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Recipients</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadSampleCsv}
                  type="button"
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
                    type="button"
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addRecipient}
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add another recipient
            </button>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              type="button"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNextToReview}
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Test and Send */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Test and Send</h2>
            <p className="text-gray-600">Ready to issue these certificates?</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <div className="text-sm text-gray-600">Certificate</div>
              <div className="font-medium">{certificateName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Design</div>
              <div className="font-medium">{customDesign ? 'Fabric design' : 'Not selected yet'}</div>
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
              type="button"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleIssue}
              disabled={loading}
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Issuing...' : 'Issue & Send'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && result && (
        <div className="max-w-4xl mx-auto text-center space-y-6">
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
              type="button"
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
                setCustomDesign(null)
                setHasEdits(false)
                setResult(null)
              }}
              type="button"
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
