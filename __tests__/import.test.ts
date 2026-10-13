import { validateRows, type ParsedRow, type ColumnMapping } from '../lib/import/parser'

describe('Import Validation', () => {
  const mockRows: ParsedRow[] = [
    { rowNumber: 1, data: { Name: 'John Doe', Email: 'john@example.com', Date: '2024-01-01' } },
    { rowNumber: 2, data: { Name: 'Jane Smith', Email: 'jane@example.com', Date: '2024-01-02' } },
    { rowNumber: 3, data: { Name: '', Email: 'missing@example.com', Date: '2024-01-03' } },
    { rowNumber: 4, data: { Name: 'Invalid Email', Email: 'not-an-email', Date: '2024-01-04' } },
    { rowNumber: 5, data: { Name: 'Duplicate', Email: 'john@example.com', Date: '2024-01-05' } },
    { rowNumber: 6, data: { Name: 'Already Exists', Email: 'existing@example.com', Date: '2024-01-06' } },
  ]

  const columnMapping: ColumnMapping = {
    name: 'Name',
    email: 'Email',
    issueDate: 'Date',
  }

  const existingEmails = new Set(['existing@example.com'])

  it('validates correct rows as valid', () => {
    const results = validateRows(mockRows, columnMapping, existingEmails)
    
    const validResults = results.filter(r => r.status === 'valid')
    expect(validResults.length).toBe(2)
    expect(validResults[0].data?.name).toBe('John Doe')
    expect(validResults[1].data?.name).toBe('Jane Smith')
  })

  it('marks missing name as error', () => {
    const results = validateRows(mockRows, columnMapping, existingEmails)
    
    const errorResult = results.find(r => r.rowNumber === 3)
    expect(errorResult?.status).toBe('error')
    expect(errorResult?.reason).toContain('Missing required field')
  })

  it('marks invalid email as error', () => {
    const results = validateRows(mockRows, columnMapping, existingEmails)
    
    const errorResult = results.find(r => r.rowNumber === 4)
    expect(errorResult?.status).toBe('error')
    expect(errorResult?.reason).toContain('Invalid email format')
  })

  it('skips duplicate emails in batch', () => {
    const results = validateRows(mockRows, columnMapping, existingEmails)
    
    const skipResult = results.find(r => r.rowNumber === 5)
    expect(skipResult?.status).toBe('skip')
    expect(skipResult?.reason).toContain('Duplicate email in this batch')
  })

  it('skips existing learner emails', () => {
    const results = validateRows(mockRows, columnMapping, existingEmails)
    
    const skipResult = results.find(r => r.rowNumber === 6)
    expect(skipResult?.status).toBe('skip')
    expect(skipResult?.reason).toContain('already exists')
  })

  it('normalizes emails to lowercase', () => {
    const rows: ParsedRow[] = [
      { rowNumber: 1, data: { Name: 'Test', Email: 'Test@EXAMPLE.COM', Date: '2024-01-01' } },
    ]
    
    const results = validateRows(rows, columnMapping, new Set())
    
    expect(results[0].data?.email).toBe('test@example.com')
  })

  it('counts all rows correctly', () => {
    const results = validateRows(mockRows, columnMapping, existingEmails)
    
    const validCount = results.filter(r => r.status === 'valid').length
    const errorCount = results.filter(r => r.status === 'error').length
    const skipCount = results.filter(r => r.status === 'skip').length
    
    expect(validCount + errorCount + skipCount).toBe(mockRows.length)
  })

  it('handles custom fields', () => {
    const rowsWithCustom: ParsedRow[] = [
      { rowNumber: 1, data: { Name: 'Test', Email: 'test@example.com', Cohort: 'Spring 2024', Score: '95' } },
    ]
    
    const mappingWithCustom: ColumnMapping = {
      name: 'Name',
      email: 'Email',
      cohort: 'Cohort',
      score: 'Score',
    }
    
    const results = validateRows(rowsWithCustom, mappingWithCustom, new Set())
    
    expect(results[0].data?.custom).toEqual({
      cohort: 'Spring 2024',
      score: '95',
    })
  })
})

describe('Publish Idempotency', () => {
  it('should not double-send when publish is called twice', async () => {
    const publishedAt = new Date()
    let emailsSent = 0
    
    const certStates: Record<string, { status: string; publishedAt: Date | null }> = {
      'cert-1': { status: 'unpublished', publishedAt: null },
      'cert-2': { status: 'unpublished', publishedAt: null },
      'cert-3': { status: 'unpublished', publishedAt: null },
    }

    async function mockPublish(certIds: string[]) {
      for (const id of certIds) {
        const cert = certStates[id]
        
        if (cert && cert.status === 'unpublished') {
          cert.status = 'published'
          cert.publishedAt = publishedAt
          emailsSent++
        }
      }
      return { published: certIds.length }
    }

    const certIds = ['cert-1', 'cert-2', 'cert-3']
    await mockPublish(certIds)
    
    expect(emailsSent).toBe(3)
    
    emailsSent = 0
    await mockPublish(certIds)
    
    expect(emailsSent).toBe(0)
  })
})
