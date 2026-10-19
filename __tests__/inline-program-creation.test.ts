/**
 * Tests for inline program creation and per-program metrics (Certificate-First Phase 2)
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Inline Program Creation', () => {
  it('should have an issue certificate page that supports inline program creation', () => {
    const issuePage = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/page.tsx'), 'utf-8')
    
    // Should auto-create default template if none exists
    expect(issuePage).toContain('defaultTemplate.length === 0')
    expect(issuePage).toContain('insert(templates)')
    expect(issuePage).toContain('bodyText')
    expect(issuePage).toContain('emailSubject')
    
    // Should pass programs and template to form
    expect(issuePage).toContain('allPrograms')
    expect(issuePage).toContain('defaultTemplateId')
    expect(issuePage).toContain('IssueCertificateForm')
  })

  it('should have a form that allows creating programs inline', () => {
    const form = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/form.tsx'), 'utf-8')
    
    // Should be a client component
    expect(form).toMatch(/^'use client'/)
    
    // Should have program picker
    expect(form).toContain('programId')
    expect(form).toContain('newProgramName')
    expect(form).toContain('isCreatingProgram')
    
    // Should toggle between existing and new program
    expect(form).toContain('Create new program')
    expect(form).toContain('Use existing program')
    
    // Should explain defaults
    expect(form).toContain('default template')
    expect(form).toContain('no expiry')
  })

  it('should have server actions that create programs inline', () => {
    const actions = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/actions.ts'), 'utf-8')
    
    // Should accept both programId and newProgramName
    expect(actions).toContain('programId?')
    expect(actions).toContain('newProgramName?')
    
    // Should create program if name provided
    expect(actions).toContain('insert(courses)')
    expect(actions).toContain('templateId: data.defaultTemplateId')
    expect(actions).toContain('validityMonths: null')
    
    // Should generate program code
    expect(actions).toContain('programCode')
    expect(actions).toContain('toUpperCase()')
  })

  it('should work with zero programs and zero templates', () => {
    const issuePage = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/page.tsx'), 'utf-8')
    const form = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/form.tsx'), 'utf-8')
    
    // Page creates default template if needed
    expect(issuePage).toContain('if (defaultTemplate.length === 0)')
    
    // Form defaults to create mode when no programs
    expect(form).toContain('programs.length === 0')
    expect(form).toContain('setIsCreatingProgram')
  })
})

describe('Per-Program Metrics', () => {
  it('programs page now redirects to certificates (certificate-first UX)', () => {
    const programsPage = readFileSync(join(process.cwd(), 'app/dashboard/programs/page.tsx'), 'utf-8')
    
    // Programs merged with certificates in certificate-first UX
    expect(programsPage).toContain('redirect')
    expect(programsPage).toContain('/dashboard/certificates')
  })

  it('should show per-program metrics on certificates page', () => {
    const certificatesPage = readFileSync(join(process.cwd(), 'app/dashboard/certificates/page.tsx'), 'utf-8')
    
    // Should show metrics per program
    expect(certificatesPage).toContain('allPrograms')
    expect(certificatesPage).toContain('issued')
    expect(certificatesPage).toContain('views')
    expect(certificatesPage).toContain('linkedinClicks')
  })

  it('should exclude bot traffic from metrics', () => {
    const shareImpact = readFileSync(join(process.cwd(), 'app/dashboard/results/share-impact.tsx'), 'utf-8')
    
    // Share Impact component filters out bot traffic
    expect(shareImpact).toContain('isBot')
    expect(shareImpact).toContain('false')
  })
})

describe('Server Component Compliance', () => {
  it('should not have event handlers in the issue page', () => {
    const issuePage = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/page.tsx'), 'utf-8')
    
    // Should be a Server Component (no 'use client')
    expect(issuePage).not.toMatch(/^'use client'/)
    
    // Should not have event handlers
    expect(issuePage).not.toContain('onChange=')
    expect(issuePage).not.toContain('onClick=')
    expect(issuePage).not.toContain('onSubmit=')
  })

  it('should have event handlers only in the client form component', () => {
    const form = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/form.tsx'), 'utf-8')
    
    // Should be a Client Component
    expect(form).toMatch(/^'use client'/)
    
    // Can have event handlers
    expect(form).toContain('onChange')
    expect(form).toContain('onSubmit')
  })
})
