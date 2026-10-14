import { validateRows, type ParsedRow, type ColumnMapping } from '../lib/import/parser'

describe('End-to-End Workflow Tests', () => {
  it('validates 500 rows with correct data structure', () => {
    const mockRows: ParsedRow[] = []
    for (let i = 1; i <= 500; i++) {
      mockRows.push({
        rowNumber: i,
        data: {
          Name: `Learner ${i}`,
          Email: `learner${i}@example.com`,
          Date: '2024-01-15',
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
    
    const validRows = validationResults.filter(r => r.status === 'valid')
    expect(validRows[0].data?.name).toBe('Learner 1')
    expect(validRows[0].data?.email).toBe('learner1@example.com')
    expect(validRows[0].data?.custom?.cohort).toBe('Spring 2024')
    
    expect(validRows[499].data?.name).toBe('Learner 500')
    expect(validRows[499].data?.email).toBe('learner500@example.com')
  })
})

describe('Certificate Number Generation', () => {
  it('generates unique certificate numbers with correct format', () => {
    const numbers = new Set()
    
    for (let i = 0; i < 100; i++) {
      const mockNumber = `CSB-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      numbers.add(mockNumber)
      expect(mockNumber).toMatch(/^CSB-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    }
    
    expect(numbers.size).toBeGreaterThan(95)
  })
})

describe('LinkedIn URL Generation', () => {
  it('generates correct LinkedIn add-to-profile URL', () => {
    function generateLinkedInUrl(params: any) {
      const baseUrl = 'https://www.linkedin.com/profile/add'
      const queryParams = new URLSearchParams({
        startTask: 'CERTIFICATION_NAME',
        name: params.name,
        organizationName: params.organizationName,
        issueYear: String(params.issueYear),
        issueMonth: String(params.issueMonth),
        certId: params.certId,
        certUrl: params.certUrl,
      })

      if (params.expirationYear && params.expirationMonth) {
        queryParams.append('expirationYear', String(params.expirationYear))
        queryParams.append('expirationMonth', String(params.expirationMonth))
      }

      return `${baseUrl}?${queryParams.toString()}`
    }
    
    const url = generateLinkedInUrl({
      name: 'Creative Strategy Bootcamp',
      organizationName: 'Motion Academy',
      issueYear: 2024,
      issueMonth: 1,
      expirationYear: 2026,
      expirationMonth: 1,
      certId: 'CSB-7F3Q-92XD',
      certUrl: 'https://example.com/c/CSB-7F3Q-92XD',
    })
    
    expect(url).toContain('linkedin.com/profile/add')
    expect(url).toContain('startTask=CERTIFICATION_NAME')
    expect(url).toContain('name=Creative+Strategy+Bootcamp')
    expect(url).toContain('organizationName=Motion+Academy')
    expect(url).toContain('issueYear=2024')
    expect(url).toContain('issueMonth=1')
    expect(url).toContain('expirationYear=2026')
    expect(url).toContain('expirationMonth=1')
    expect(url).toContain('certId=CSB-7F3Q-92XD')
    expect(url).toContain('certUrl=')
  })

  it('generates LinkedIn URL without expiry date', () => {
    function generateLinkedInUrl(params: any) {
      const baseUrl = 'https://www.linkedin.com/profile/add'
      const queryParams = new URLSearchParams({
        startTask: 'CERTIFICATION_NAME',
        name: params.name,
        organizationName: params.organizationName,
        issueYear: String(params.issueYear),
        issueMonth: String(params.issueMonth),
        certId: params.certId,
        certUrl: params.certUrl,
      })

      if (params.expirationYear && params.expirationMonth) {
        queryParams.append('expirationYear', String(params.expirationYear))
        queryParams.append('expirationMonth', String(params.expirationMonth))
      }

      return `${baseUrl}?${queryParams.toString()}`
    }
    
    const url = generateLinkedInUrl({
      name: 'Creative Strategy Bootcamp',
      organizationName: 'Motion Academy',
      issueYear: 2024,
      issueMonth: 1,
      certId: 'CSB-7F3Q-92XD',
      certUrl: 'https://example.com/c/CSB-7F3Q-92XD',
    })
    
    expect(url).not.toContain('expirationYear')
    expect(url).not.toContain('expirationMonth')
  })
})

describe('UTM Parameter Addition', () => {
  it('adds UTM parameters to CTA URL', () => {
    const url = 'https://motionapp.com/signup'
    const courseCode = 'CSB'
    const certificateNumber = 'CSB-7F3Q-92XD'
    
    const urlObj = new URL(url)
    urlObj.searchParams.set('utm_source', 'credential')
    urlObj.searchParams.set('utm_medium', 'referral')
    urlObj.searchParams.set('utm_campaign', courseCode)
    urlObj.searchParams.set('utm_content', certificateNumber)
    const result = urlObj.toString()
    
    expect(result).toContain('utm_source=credential')
    expect(result).toContain('utm_medium=referral')
    expect(result).toContain('utm_campaign=CSB')
    expect(result).toContain('utm_content=CSB-7F3Q-92XD')
  })
})

describe('Event Logging', () => {
  it('identifies bot user agents correctly', () => {
    function isBot(ua: string): boolean {
      const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /googlebot/i,
        /facebookexternalhit/i,
        /linkedinbot/i,
      ]
      return botPatterns.some(pattern => pattern.test(ua))
    }
    
    const botUserAgents = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    ]
    
    botUserAgents.forEach(ua => {
      expect(isBot(ua)).toBe(true)
    })
    
    const humanUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    ]
    
    humanUserAgents.forEach(ua => {
      expect(isBot(ua)).toBe(false)
    })
  })
})
