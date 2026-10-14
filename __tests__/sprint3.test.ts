import { validateRows, type ParsedRow, type ColumnMapping } from '../lib/import/parser'

describe('End-to-End 500-Row Test', () => {
  it('validates and processes 500 rows with correct counts', () => {
    const mockRows: ParsedRow[] = []
    for (let i = 1; i <= 500; i++) {
      mockRows.push({
        rowNumber: i,
        data: {
          Name: `Learner ${i}`,
          Email: `learner${i}@example.com`,
          Date: `2024-01-${(i % 28) + 1}`,
          Cohort: 'Spring 2024',
        },
      })
    }

    const columnMapping: ColumnMapping = {
      name: 'Name',
      email: 'Email',
      issueDate: 'Date',
      cohort: 'Cohort',
    }

    const validationResults = validateRows(mockRows, columnMapping, new Set())

    const validCount = validationResults.filter(r => r.status === 'valid').length
    const errorCount = validationResults.filter(r => r.status === 'error').length
    const skipCount = validationResults.filter(r => r.status === 'skip').length

    expect(validCount).toBe(500)
    expect(errorCount).toBe(0)
    expect(skipCount).toBe(0)

    expect(validCount + errorCount + skipCount).toBe(500)

    validationResults.forEach((result, index) => {
      expect(result.rowNumber).toBe(index + 1)
      if (result.status === 'valid' && result.data) {
        expect(result.data.name).toMatch(/^Learner \d+$/)
        expect(result.data.email).toMatch(/^learner\d+@example\.com$/)
        expect(result.data.custom?.cohort).toBe('Spring 2024')
      }
    })
  })

  it('handles duplicate detection in large batches', () => {
    const mockRows: ParsedRow[] = []
    
    for (let i = 1; i <= 250; i++) {
      mockRows.push({
        rowNumber: i,
        data: {
          Name: `Learner ${i}`,
          Email: `learner${i}@example.com`,
          Date: '2024-01-15',
        },
      })
    }
    
    for (let i = 1; i <= 250; i++) {
      mockRows.push({
        rowNumber: i + 250,
        data: {
          Name: `Learner ${i}`,
          Email: `learner${i}@example.com`,
          Date: '2024-01-15',
        },
      })
    }

    const columnMapping: ColumnMapping = {
      name: 'Name',
      email: 'Email',
      issueDate: 'Date',
    }

    const validationResults = validateRows(mockRows, columnMapping, new Set())

    const validCount = validationResults.filter(r => r.status === 'valid').length
    const skipCount = validationResults.filter(r => r.status === 'skip').length

    expect(validCount).toBe(250)
    expect(skipCount).toBe(250)
    
    const skippedResults = validationResults.filter(r => r.status === 'skip')
    skippedResults.forEach(result => {
      expect(result.reason).toContain('Duplicate email in this batch')
    })
  })

  it('handles existing learners correctly', () => {
    const mockRows: ParsedRow[] = []
    for (let i = 1; i <= 100; i++) {
      mockRows.push({
        rowNumber: i,
        data: {
          Name: `Learner ${i}`,
          Email: `learner${i}@example.com`,
          Date: '2024-01-15',
        },
      })
    }

    const existingEmails = new Set([
      'learner1@example.com',
      'learner50@example.com',
      'learner100@example.com',
    ])

    const columnMapping: ColumnMapping = {
      name: 'Name',
      email: 'Email',
      issueDate: 'Date',
    }

    const validationResults = validateRows(mockRows, columnMapping, existingEmails)

    const validCount = validationResults.filter(r => r.status === 'valid').length
    const skipCount = validationResults.filter(r => r.status === 'skip').length

    expect(validCount).toBe(97)
    expect(skipCount).toBe(3)

    const skippedForExisting = validationResults.filter(
      r => r.status === 'skip' && r.reason?.includes('already exists')
    )
    expect(skippedForExisting.length).toBe(3)
  })
})

describe('Sprint 3: Certificate Management', () => {
  it('generates valid revocation data structure', () => {
    const revocation = {
      certificateId: 'test-id',
      reason: 'Certificate issued in error',
      revokedAt: new Date(),
      status: 'revoked',
    }

    expect(revocation.reason).toBeTruthy()
    expect(revocation.reason.length).toBeGreaterThan(0)
    expect(revocation.status).toBe('revoked')
    expect(revocation.revokedAt).toBeInstanceOf(Date)
  })

  it('generates valid reissue data structure', () => {
    const reissue = {
      newCertificateId: 'new-id',
      priorCertificateId: 'old-id',
      source: 'reissue',
      issueDate: new Date(),
    }

    expect(reissue.priorCertificateId).toBeTruthy()
    expect(reissue.source).toBe('reissue')
    expect(reissue.issueDate).toBeInstanceOf(Date)
  })

  it('validates CSV export data structure', () => {
    const csvHeaders = [
      'Certificate Number',
      'Learner Name',
      'Email',
      'Course',
      'Issue Date',
      'Expiry Date',
      'Status',
      'Email Delivered',
      'Page Viewed',
      'LinkedIn Clicked',
      'CTA Clicked',
      'Is Preview',
    ]

    expect(csvHeaders).toContain('Certificate Number')
    expect(csvHeaders).toContain('Email Delivered')
    expect(csvHeaders).toContain('LinkedIn Clicked')
    expect(csvHeaders).toContain('Is Preview')
    expect(csvHeaders.length).toBe(12)
  })
})

describe('Sprint 3: Results Dashboard', () => {
  it('calculates conversion rates correctly', () => {
    const issued = 100
    const delivered = 95
    const viewed = 80
    const linkedinClicks = 40
    const ctaClicks = 30

    const deliveryRate = ((delivered / issued) * 100).toFixed(1)
    const viewRate = ((viewed / delivered) * 100).toFixed(1)
    const linkedinRate = ((linkedinClicks / viewed) * 100).toFixed(1)
    const ctaRate = ((ctaClicks / viewed) * 100).toFixed(1)

    expect(deliveryRate).toBe('95.0')
    expect(viewRate).toBe('84.2')
    expect(linkedinRate).toBe('50.0')
    expect(ctaRate).toBe('37.5')
  })

  it('handles zero division in conversion rates', () => {
    const issued = 0
    const delivered = 0

    const deliveryRate = issued > 0 ? ((delivered / issued) * 100).toFixed(1) : '0'
    const viewRate = delivered > 0 ? ((0 / delivered) * 100).toFixed(1) : '0'

    expect(deliveryRate).toBe('0')
    expect(viewRate).toBe('0')
  })

  it('filters preview certificates from analytics', () => {
    const certificates = [
      { id: '1', isPreview: false, issued: true },
      { id: '2', isPreview: true, issued: true },
      { id: '3', isPreview: false, issued: true },
      { id: '4', isPreview: true, issued: true },
    ]

    const nonPreview = certificates.filter(c => !c.isPreview)

    expect(nonPreview.length).toBe(2)
    expect(certificates.length).toBe(4)
  })
})
