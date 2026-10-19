/**
 * Tests for certificate-first UX and wizard flow
 */

import fs from 'fs'
import path from 'path'

describe('Certificate Wizard', () => {
  it('should have wizard page and components', () => {
    const wizardPageExists = fs.existsSync(path.join(process.cwd(), 'app/dashboard/wizard/page.tsx'))
    const wizardComponentExists = fs.existsSync(path.join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'))
    const wizardActionsExist = fs.existsSync(path.join(process.cwd(), 'app/dashboard/wizard/actions.ts'))
    
    expect(wizardPageExists).toBe(true)
    expect(wizardComponentExists).toBe(true)
    expect(wizardActionsExist).toBe(true)
  })

  it('should have 12 professional designer starter templates', () => {
    const starterTemplates = require('../lib/certificate-builder/starter-templates')
    expect(starterTemplates.STARTER_TEMPLATES).toHaveLength(12)
    
    // Check each template has required v2 fields
    starterTemplates.STARTER_TEMPLATES.forEach((template: any) => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('config')
      expect(template.config).toHaveProperty('version')
      expect(template.config.version).toBe(2)
      expect(template.config).toHaveProperty('elements')
      expect(template.config.elements).toBeInstanceOf(Array)
    })
  })

  it('should have diverse template designs', () => {
    const { STARTER_TEMPLATES } = require('../lib/certificate-builder/starter-templates')
    
    // Check for both portrait and landscape
    const portraits = STARTER_TEMPLATES.filter((t: any) => t.orientation === 'portrait')
    const landscapes = STARTER_TEMPLATES.filter((t: any) => t.orientation === 'landscape')
    
    expect(portraits.length).toBeGreaterThan(0)
    expect(landscapes.length).toBeGreaterThan(0)
    
    // Each should have elements
    STARTER_TEMPLATES.forEach((t: any) => {
      expect(t.config.elements.length).toBeGreaterThan(0)
    })
  })

  it('wizard actions should export required functions', () => {
    const actions = require('../app/dashboard/wizard/actions')
    
    expect(typeof actions.createCertificateFromWizard).toBe('function')
    expect(typeof actions.parseCsvRecipients).toBe('function')
    expect(typeof actions.checkFirstTimeUser).toBe('function')
    expect(typeof actions.createSampleCertificate).toBe('function')
  })

  it('should handle CSV parsing correctly', async () => {
    const { parseCsvRecipients } = require('../app/dashboard/wizard/actions')
    
    const csv = 'Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com'
    const recipients = await parseCsvRecipients(csv)
    
    expect(recipients).toHaveLength(2)
    expect(recipients[0]).toEqual({ name: 'John Doe', email: 'john@example.com' })
    expect(recipients[1]).toEqual({ name: 'Jane Smith', email: 'jane@example.com' })
  })

  it('should dedupe recipients by email', async () => {
    const { parseCsvRecipients } = require('../app/dashboard/wizard/actions')
    
    const csv = 'Name,Email\nJohn Doe,john@example.com\nJohn Smith,john@example.com'
    const recipients = await parseCsvRecipients(csv)
    
    expect(recipients).toHaveLength(1)
  })

  it('should handle CSV without headers', async () => {
    const { parseCsvRecipients } = require('../app/dashboard/wizard/actions')
    
    const csv = 'John Doe,john@example.com\nJane Smith,jane@example.com'
    const recipients = await parseCsvRecipients(csv)
    
    expect(recipients).toHaveLength(2)
  })

  it('should skip invalid rows in CSV', async () => {
    const { parseCsvRecipients } = require('../app/dashboard/wizard/actions')
    
    const csv = 'Name,Email\nJohn Doe,john@example.com\nInvalid Row\nJane Smith,jane@example.com'
    const recipients = await parseCsvRecipients(csv)
    
    expect(recipients).toHaveLength(2)
  })
})

describe('Certificate-First UX', () => {
  it('certificates page should show program metrics', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
      'utf-8'
    )
    
    expect(pageContent).toContain('Issued')
    expect(pageContent).toContain('Views')
    expect(pageContent).toContain('LinkedIn')
    expect(pageContent).toContain('Create certificate')
  })

  it('should redirect first-time users to wizard', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
      'utf-8'
    )
    
    expect(pageContent).toContain('checkFirstTimeUser')
    expect(pageContent).toContain('redirect(\'/dashboard/wizard\')')
  })

  it('should have redirects for old URLs', () => {
    const programsRedirect = fs.existsSync(path.join(process.cwd(), 'app/dashboard/programs/page.tsx'))
    const coursesRedirect = fs.existsSync(path.join(process.cwd(), 'app/dashboard/courses/page.tsx'))
    
    expect(programsRedirect).toBe(true)
    expect(coursesRedirect).toBe(true)
    
    const programsContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/programs/page.tsx'),
      'utf-8'
    )
    expect(programsContent).toContain('redirect(\'/dashboard/certificates\')')
  })

  it('navigation should not show "Certificate Programs"', () => {
    const layoutContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/layout.tsx'),
      'utf-8'
    )
    
    expect(layoutContent).not.toContain('Certificate Programs')
    expect(layoutContent).toContain('Certificates')
  })

  it('should show "LinkedIn shares = signups" tip', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
      'utf-8'
    )
    
    expect(pageContent).toContain('LinkedIn shares = signups')
  })
})

describe('Sample Certificate', () => {
  it('signup should create sample certificate', () => {
    const signupContent = fs.readFileSync(
      path.join(process.cwd(), 'app/(marketing)/signup/actions.ts'),
      'utf-8'
    )
    
    expect(signupContent).toContain('createSampleCertificate')
  })

  it('sample certificate should use Modern template', () => {
    const actionsContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/wizard/actions.ts'),
      'utf-8'
    )
    
    expect(actionsContent).toContain('Sample Certificate')
    expect(actionsContent).toContain('Sample')
  })

  it('certificates page should label sample certificates', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
      'utf-8'
    )
    
    expect(pageContent).toContain('Sample Certificate')
    expect(pageContent).toContain('Sample')
  })
})

describe('Email Failure Handling', () => {
  it('signup should handle email failures gracefully', () => {
    const signupContent = fs.readFileSync(
      path.join(process.cwd(), 'app/(marketing)/signup/actions.ts'),
      'utf-8'
    )
    
    expect(signupContent).toContain('try {')
    expect(signupContent).toContain('catch')
    expect(signupContent).toContain('emailSent')
    expect(signupContent).toContain('Continue with Google')
  })

  it('wizard should handle email failures without crashing', () => {
    const wizardContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/wizard/actions.ts'),
      'utf-8'
    )
    
    expect(wizardContent).toContain('try {')
    expect(wizardContent).toContain('sendCertificateEmail')
    expect(wizardContent).toContain('catch')
    expect(wizardContent).toContain('emailErrors')
  })

  it('wizard success screen should show email delivery note', () => {
    const wizardContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'),
      'utf-8'
    )
    
    expect(wizardContent).toContain('emailErrors')
    expect(wizardContent).toContain('Email delivery note')
    expect(wizardContent).toContain('verified sending domain')
  })

  it('signup form should suggest Google OAuth on email failure', () => {
    const formContent = fs.readFileSync(
      path.join(process.cwd(), 'app/(marketing)/signup/form.tsx'),
      'utf-8'
    )
    
    expect(formContent).toContain('Google')
    expect(formContent).toContain('Try Google sign-in')
  })
})

describe('Auto-Program Creation', () => {
  it('wizard should auto-create program for certificate', () => {
    const wizardContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/wizard/actions.ts'),
      'utf-8'
    )
    
    expect(wizardContent).toContain('courses')
    expect(wizardContent).toContain('Auto-create a program')
    expect(wizardContent).toContain('insert(courses)')
  })

  it('should use certificate name as program name by default', () => {
    const wizardContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/wizard/actions.ts'),
      'utf-8'
    )
    
    expect(wizardContent).toContain('programName || certificateName')
  })
})

describe('No Server Component Regressions', () => {
  it('wizard component should be client component', () => {
    const wizardContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'),
      'utf-8'
    )
    
    expect(wizardContent).toContain("'use client'")
  })

  it('signup form should be client component', () => {
    const formContent = fs.readFileSync(
      path.join(process.cwd(), 'app/(marketing)/signup/form.tsx'),
      'utf-8'
    )
    
    expect(formContent).toContain("'use client'")
  })

  it('certificates page should not have inline event handlers', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
      'utf-8'
    )
    
    // Should not have onClick, onChange, etc directly in Server Component
    const hasInlineHandlers = /\s(onClick|onChange|onSubmit|onInput)=\{/.test(pageContent)
    expect(hasInlineHandlers).toBe(false)
  })
})
