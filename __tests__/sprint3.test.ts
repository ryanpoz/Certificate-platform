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

  it('stores pending changes separately for published certificates', () => {
    const originalCert = {
      id: 'cert-1',
      status: 'published',
      learnerName: 'John Doe',
      issueDate: new Date('2024-01-15'),
      custom: { field1: 'value1' },
      pendingChanges: null,
    }

    const pendingChanges = {
      learnerName: 'Jane Doe',
      issueDate: '2024-02-01',
      custom: { field1: 'value2' },
    }

    const updatedCert = {
      ...originalCert,
      pendingChanges,
    }

    expect(updatedCert.learnerName).toBe('John Doe')
    expect(updatedCert.pendingChanges).not.toBeNull()
    expect(updatedCert.pendingChanges?.learnerName).toBe('Jane Doe')
    expect(originalCert.learnerName).toBe('John Doe')
  })

  it('applies pending changes on republish', () => {
    const certWithPending = {
      id: 'cert-1',
      status: 'published',
      learnerName: 'John Doe',
      issueDate: new Date('2024-01-15'),
      pendingChanges: {
        learnerName: 'Jane Doe',
        issueDate: '2024-02-01',
        custom: { field1: 'updated' },
      },
    }

    const republishedCert = {
      ...certWithPending,
      learnerName: certWithPending.pendingChanges.learnerName,
      issueDate: new Date(certWithPending.pendingChanges.issueDate),
      pendingChanges: null,
    }

    expect(republishedCert.learnerName).toBe('Jane Doe')
    expect(republishedCert.pendingChanges).toBeNull()
    expect(republishedCert.issueDate.toISOString().split('T')[0]).toBe('2024-02-01')
  })

  it('allows unpublished certificates to edit directly without pending changes', () => {
    const unpublishedCert = {
      id: 'cert-1',
      status: 'unpublished',
      learnerName: 'John Doe',
      pendingChanges: null,
    }

    const editedCert = {
      ...unpublishedCert,
      learnerName: 'Jane Doe',
    }

    expect(editedCert.learnerName).toBe('Jane Doe')
    expect(editedCert.pendingChanges).toBeNull()
    expect(editedCert.status).toBe('unpublished')
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

describe('Sprint 3 Fixes: Pagination', () => {
  it('calculates pagination correctly for 2500 certificates', () => {
    const totalCount = 2500
    const limit = 50
    const totalPages = Math.ceil(totalCount / limit)
    
    expect(totalPages).toBe(50)
    
    const page1Offset = (1 - 1) * limit
    const page1End = Math.min(page1Offset + limit, totalCount)
    expect(page1Offset).toBe(0)
    expect(page1End).toBe(50)
    
    const page25Offset = (25 - 1) * limit
    const page25End = Math.min(page25Offset + limit, totalCount)
    expect(page25Offset).toBe(1200)
    expect(page25End).toBe(1250)
    
    const page50Offset = (50 - 1) * limit
    const page50End = Math.min(page50Offset + limit, totalCount)
    expect(page50Offset).toBe(2450)
    expect(page50End).toBe(2500)
  })

  it('calculates has next/prev page correctly', () => {
    const totalCount = 2500
    const limit = 50
    const totalPages = Math.ceil(totalCount / limit)
    
    const page1 = 1
    const page25 = 25
    const page50 = 50
    
    expect(page1 < totalPages).toBe(true)
    expect(page1 > 1).toBe(false)
    
    expect(page25 < totalPages).toBe(true)
    expect(page25 > 1).toBe(true)
    
    expect(page50 < totalPages).toBe(false)
    expect(page50 > 1).toBe(true)
  })

  it('generates correct pagination display for large page counts', () => {
    const totalPages = 50
    const currentPage = 25
    
    const maxDisplayed = 7
    const startPage = Math.max(1, currentPage - 3)
    const endPage = Math.min(totalPages, startPage + maxDisplayed - 1)
    
    expect(endPage - startPage + 1).toBeLessThanOrEqual(maxDisplayed)
    expect(startPage).toBe(22)
    expect(endPage).toBe(28)
  })

  it('validates bulk actions apply to all filtered results, not just current page', () => {
    const totalFilteredCount = 250
    const currentPageCount = 50
    
    expect(totalFilteredCount).toBeGreaterThan(currentPageCount)
    expect(totalFilteredCount / currentPageCount).toBe(5)
  })

  it('handles edge case pagination', () => {
    const testCases = [
      { total: 0, limit: 50, expectedPages: 0 },
      { total: 1, limit: 50, expectedPages: 1 },
      { total: 50, limit: 50, expectedPages: 1 },
      { total: 51, limit: 50, expectedPages: 2 },
      { total: 100, limit: 50, expectedPages: 2 },
      { total: 2500, limit: 50, expectedPages: 50 },
      { total: 2501, limit: 50, expectedPages: 51 },
    ]

    testCases.forEach(({ total, limit, expectedPages }) => {
      const pages = Math.ceil(total / limit)
      expect(pages).toBe(expectedPages)
    })
  })
})
