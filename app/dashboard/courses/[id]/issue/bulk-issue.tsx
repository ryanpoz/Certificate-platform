'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseSpreadsheet, validateRows, type ParseResult, type ColumnMapping, type ValidationResult } from '@/lib/import/parser'
import { getExistingLearnerEmails, createDraftsFromValidation } from '@/lib/import/actions'

type Step = 'upload' | 'map' | 'validate' | 'summary'

export default function BulkIssuePage({ course, academyId, userId }: { course: any; academyId: string; userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [summary, setSummary] = useState<{ created: number; errors: string[] } | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB')
      return
    }

    setProcessing(true)
    try {
      const result = await parseSpreadsheet(file)
      
      if (result.rows.length > 5000) {
        alert('Maximum 5,000 rows allowed per upload')
        setProcessing(false)
        return
      }

      setParseResult(result)
      
      const autoMapping: ColumnMapping = {}
      result.headers.forEach(header => {
        const lower = header.toLowerCase()
        if (lower.includes('name') && !lower.includes('email')) {
          autoMapping.name = header
        } else if (lower.includes('email') || lower.includes('e-mail')) {
          autoMapping.email = header
        } else if (lower.includes('date') || lower.includes('issue')) {
          autoMapping.issueDate = header
        }
      })
      
      setColumnMapping(autoMapping)
      setStep('map')
    } catch (error) {
      alert(`Failed to parse file: ${error}`)
    }
    setProcessing(false)
  }

  async function handleValidate() {
    if (!parseResult) return

    setProcessing(true)
    try {
      const existingEmails = await getExistingLearnerEmails(academyId, course.id)
      const existingSet = new Set(existingEmails)
      
      const results = validateRows(parseResult.rows, columnMapping, existingSet)
      setValidationResults(results)
      setStep('validate')
    } catch (error) {
      alert(`Validation failed: ${error}`)
    }
    setProcessing(false)
  }

  async function handleCreateDrafts() {
    if (!parseResult) return

    setProcessing(true)
    try {
      const validRows = validationResults
        .filter(r => r.status === 'valid' && r.data)
        .map(r => r.data!)

      const result = await createDraftsFromValidation(
        academyId,
        course.id,
        userId,
        validRows,
        parseResult.fileName,
        columnMapping
      )

      setSummary(result)
      setStep('summary')
    } catch (error) {
      alert(`Failed to create drafts: ${error}`)
    }
    setProcessing(false)
  }

  const validCount = validationResults.filter(r => r.status === 'valid').length
  const errorCount = validationResults.filter(r => r.status === 'error').length
  const skipCount = validationResults.filter(r => r.status === 'skip').length

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Issue Certificates: {course.name}</h1>
        <p className="mt-2 text-sm text-gray-700">Upload a CSV or Excel file to issue certificates in bulk</p>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4">
          <div className={`flex items-center ${step === 'upload' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">1</span>
            <span className="ml-2">Upload</span>
          </div>
          <div className={`flex items-center ${step === 'map' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">2</span>
            <span className="ml-2">Map</span>
          </div>
          <div className={`flex items-center ${step === 'validate' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">3</span>
            <span className="ml-2">Validate</span>
          </div>
          <div className={`flex items-center ${step === 'summary' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">4</span>
            <span className="ml-2">Summary</span>
          </div>
        </nav>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        {step === 'upload' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={processing}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Choose CSV or Excel File'}
              </label>
              <p className="mt-4 text-sm text-gray-500">
                Maximum 5,000 rows, 10MB file size
              </p>
            </div>
          </div>
        )}

        {step === 'map' && parseResult && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Map Columns</h2>
            <p className="text-sm text-gray-600 mb-4">
              File: {parseResult.fileName} ({parseResult.rows.length} rows)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name Column *</label>
                <select
                  value={columnMapping.name || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  required
                >
                  <option value="">Select column...</option>
                  {parseResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Column *</label>
                <select
                  value={columnMapping.email || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  required
                >
                  <option value="">Select column...</option>
                  {parseResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Date Column (optional)</label>
                <select
                  value={columnMapping.issueDate || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, issueDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">Use today's date</option>
                  {parseResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('upload')}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleValidate}
                disabled={!columnMapping.name || !columnMapping.email || processing}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Validating...' : 'Validate'}
              </button>
            </div>
          </div>
        )}

        {step === 'validate' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validCount}</div>
                <div className="text-sm text-green-800">Valid</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{skipCount}</div>
                <div className="text-sm text-yellow-800">Skipped</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-red-800">Errors</div>
              </div>
            </div>

            {(errorCount > 0 || skipCount > 0) && (
              <div className="max-h-96 overflow-y-auto border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationResults
                      .filter(r => r.status !== 'valid')
                      .map(result => (
                        <tr key={result.rowNumber}>
                          <td className="px-3 py-2 text-sm">{result.rowNumber}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              result.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">{result.reason}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('map')}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCreateDrafts}
                disabled={validCount === 0 || processing}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Creating...' : `Create ${validCount} Drafts`}
              </button>
            </div>
          </div>
        )}

        {step === 'summary' && summary && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
            
            <div className="bg-green-50 p-6 rounded-lg mb-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{summary.created}</div>
              <div className="text-green-800">Certificates created as drafts</div>
            </div>

            {summary.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-red-800 mb-2">Errors:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {summary.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => router.push(`/dashboard/certificates?course=${course.id}&status=unpublished`)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                View Drafts
              </button>
              <button
                onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
