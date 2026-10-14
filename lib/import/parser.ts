import * as XLSX from 'xlsx'

export interface ParsedRow {
  rowNumber: number
  data: Record<string, string>
}

export interface ParseResult {
  headers: string[]
  rows: ParsedRow[]
  fileName: string
}

export function parseSpreadsheet(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { 
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd'
        })

        if (jsonData.length === 0) {
          reject(new Error('File is empty'))
          return
        }

        const headers = jsonData[0] as string[]
        const rows: ParsedRow[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const rowData: Record<string, string> = {}
          headers.forEach((header, index) => {
            const value = row[index]
            rowData[header] = value != null ? String(value).trim() : ''
          })

          rows.push({
            rowNumber: i + 1,
            data: rowData,
          })
        }

        resolve({
          headers,
          rows,
          fileName: file.name,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export interface ColumnMapping {
  name?: string
  email?: string
  issueDate?: string
  [key: string]: string | undefined
}

export interface ValidationResult {
  rowNumber: number
  status: 'valid' | 'error' | 'skip'
  reason?: string
  data: {
    name: string
    email: string
    issueDate: Date
    custom: Record<string, any>
  } | null
}

export function validateRows(
  rows: ParsedRow[],
  columnMapping: ColumnMapping,
  existingEmails: Set<string>
): ValidationResult[] {
  const results: ValidationResult[] = []
  const seenInBatch = new Set<string>()

  for (const row of rows) {
    const name = columnMapping.name ? row.data[columnMapping.name] : ''
    const email = columnMapping.email ? row.data[columnMapping.email] : ''
    const issueDateStr = columnMapping.issueDate ? row.data[columnMapping.issueDate] : ''

    if (!name || !email) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'error',
        reason: 'Missing required field: name or email',
        data: null,
      })
      continue
    }

    const emailNormalised = email.toLowerCase().trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalised)) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'error',
        reason: 'Invalid email format',
        data: null,
      })
      continue
    }

    if (seenInBatch.has(emailNormalised)) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'skip',
        reason: 'Duplicate email in this batch',
        data: null,
      })
      continue
    }

    if (existingEmails.has(emailNormalised)) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'skip',
        reason: 'Certificate already exists for this learner',
        data: null,
      })
      continue
    }

    let issueDate = new Date()
    if (issueDateStr) {
      const parsed = new Date(issueDateStr)
      if (isNaN(parsed.getTime())) {
        results.push({
          rowNumber: row.rowNumber,
          status: 'error',
          reason: 'Invalid date format',
          data: null,
        })
        continue
      }
      issueDate = parsed
    }

    const custom: Record<string, any> = {}
    Object.entries(columnMapping).forEach(([field, column]) => {
      if (field !== 'name' && field !== 'email' && field !== 'issueDate' && column) {
        custom[field] = row.data[column] || ''
      }
    })

    seenInBatch.add(emailNormalised)
    results.push({
      rowNumber: row.rowNumber,
      status: 'valid',
      data: {
        name: name.trim(),
        email: emailNormalised,
        issueDate,
        custom,
      },
    })
  }

  return results
}
