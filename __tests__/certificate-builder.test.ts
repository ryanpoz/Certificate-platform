/**
 * Tests for Certificate Builder feature
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { STARTER_TEMPLATES, FONT_PAIRS, MERGE_FIELDS, getDefaultDesignConfig, renderMergeFields } from '../lib/certificate-builder/types'

describe('Certificate Builder Types', () => {
  it('should have all 4 starter templates defined', () => {
    expect(Object.keys(STARTER_TEMPLATES)).toEqual(['modern', 'classic', 'minimal', 'bold'])
    
    Object.values(STARTER_TEMPLATES).forEach(template => {
      expect(template.colors).toBeDefined()
      expect(template.fonts).toBeDefined()
      expect(template.background).toBeDefined()
      expect(template.border).toBeDefined()
      expect(template.layout).toBeDefined()
      expect(template.bodyText).toBeDefined()
    })
  })

  it('should have 6 curated font pairs', () => {
    expect(FONT_PAIRS).toHaveLength(6)
    
    FONT_PAIRS.forEach(pair => {
      expect(pair.id).toBeDefined()
      expect(pair.name).toBeDefined()
      expect(pair.heading).toBeDefined()
      expect(pair.body).toBeDefined()
      expect(pair.style).toBeDefined()
    })
  })

  it('should have standard merge fields defined', () => {
    const expectedFields = [
      '{{recipient_name}}',
      '{{program_name}}',
      '{{issue_date}}',
      '{{expiry_date}}',
      '{{certificate_number}}',
      '{{academy_name}}',
    ]
    
    const fields = MERGE_FIELDS.map(f => f.key)
    expectedFields.forEach(field => {
      expect(fields).toContain(field)
    })
  })

  it('should render merge fields correctly', () => {
    const template = 'Awarded to {{recipient_name}} for {{program_name}} on {{issue_date}}'
    const data = {
      recipientName: 'Jane Smith',
      programName: 'Test Course',
      issueDate: 'Jan 1, 2026',
      expiryDate: null,
      certificateNumber: 'CERT-001',
      academyName: 'Test Academy',
    }
    
    const result = renderMergeFields(template, data)
    expect(result).toBe('Awarded to Jane Smith for Test Course on Jan 1, 2026')
  })

  it('should provide default design config', () => {
    const config = getDefaultDesignConfig()
    
    expect(config.colors).toBeDefined()
    expect(config.fonts).toBeDefined()
    expect(config.background).toBeDefined()
    expect(config.border).toBeDefined()
    expect(config.layout).toBeDefined()
    expect(config.bodyText).toBeDefined()
    expect(config.signatures).toEqual([])
    expect(config.showQrCode).toBe(true)
    expect(config.showCertNumber).toBe(true)
  })
})

describe('Template Library Page', () => {
  it('templates page now redirects to certificates (simplified navigation)', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/templates/page.tsx'), 'utf-8')
    
    // Templates page redirects to certificates in certificate-first UX
    expect(page).toContain('redirect')
    expect(page).toContain('/dashboard/certificates')
  })

  it('templates and editor still accessible via direct routes', () => {
    // Templates can still be created via /dashboard/templates/new
    const newPage = readFileSync(join(process.cwd(), 'app/dashboard/templates/new/page.tsx'), 'utf-8')
    expect(newPage).toContain('Create Certificate Template')
    
    // Templates can be edited via /dashboard/templates/[id]/editor
    const editorPage = readFileSync(join(process.cwd(), 'app/dashboard/templates/[id]/editor/page.tsx'), 'utf-8')
    expect(editorPage).toBeDefined()
  })
})

describe('Template Builder', () => {
  it('should have new template page with starter selection', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/templates/new/page.tsx'), 'utf-8')
    
    expect(page).toContain('Create Certificate Template')
    expect(page).toContain('Choose a starter design')
    expect(page).toContain('STARTER_TEMPLATES')
    expect(page).toContain('StarterTemplateSelector')
  })

  it('should have edit page with builder UI', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/templates/[id]/page.tsx'), 'utf-8')
    
    // Now redirects to visual editor
    expect(page).toContain('redirect')
    expect(page).toContain('/editor')
  })

  it('should have builder component with live preview', () => {
    const builder = readFileSync(join(process.cwd(), 'app/dashboard/templates/[id]/builder.tsx'), 'utf-8')
    
    // Client component
    expect(builder).toMatch(/^'use client'/)
    
    // Controls
    expect(builder).toContain('Colors')
    expect(builder).toContain('Typography')
    expect(builder).toContain('Title')
    expect(builder).toContain('Body Text')
    expect(builder).toContain('Options')
    
    // Live rendering
    expect(builder).toContain('renderedText')
    expect(builder).toContain('sampleData')
    
    // Merge fields
    expect(builder).toContain('MERGE_FIELDS')
    
    // Save
    expect(builder).toContain('Save Changes')
    expect(builder).toContain('updateTemplateAction')
  })
})

describe('Template Actions', () => {
  it('should support duplicate, rename, delete, set default', () => {
    const actions = readFileSync(join(process.cwd(), 'app/dashboard/templates/actions.ts'), 'utf-8')
    
    expect(actions).toContain('duplicateTemplateAction')
    expect(actions).toContain('deleteTemplateAction')
    expect(actions).toContain('setDefaultTemplateAction')
    expect(actions).toContain('renameTemplateAction')
  })

  it('should prevent deleting templates in use', () => {
    const actions = readFileSync(join(process.cwd(), 'app/dashboard/templates/actions.ts'), 'utf-8')
    
    expect(actions).toContain('Cannot delete template that is in use')
    expect(actions).toContain('courses.templateId')
  })
})

describe('Schema Changes', () => {
  it('should have updated templates table schema', () => {
    const schema = readFileSync(join(process.cwd(), 'lib/db/schema.ts'), 'utf-8')
    
    expect(schema).toMatch(/name:\s*text/)
    expect(schema).toMatch(/isDefault:\s*boolean/)
    expect(schema).toMatch(/designConfig:\s*jsonb/)
    expect(schema).toMatch(/version:\s*integer/)
    expect(schema).toMatch(/updatedAt:\s*timestamp/)
  })

  it('should have SQL migration file', () => {
    const migration = readFileSync(join(process.cwd(), 'sql/003-certificate-builder.sql'), 'utf-8')
    
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS name')
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS is_default')
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS design_config')
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS version')
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS updated_at')
    
    // RLS policies
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY')
    expect(migration).toContain('CREATE POLICY')
    
    // Indexes
    expect(migration).toContain('CREATE INDEX')
    expect(migration).toContain('idx_templates_academy_default')
    
    // Triggers
    expect(migration).toContain('CREATE TRIGGER')
    expect(migration).toContain('update_updated_at_column')
  })
})

describe('Server Component Compliance', () => {
  it('should not have event handlers in Server Components', () => {
    const listPage = readFileSync(join(process.cwd(), 'app/dashboard/templates/page.tsx'), 'utf-8')
    const newPage = readFileSync(join(process.cwd(), 'app/dashboard/templates/new/page.tsx'), 'utf-8')
    const editPage = readFileSync(join(process.cwd(), 'app/dashboard/templates/[id]/page.tsx'), 'utf-8')
    
    // Should be Server Components
    expect(listPage).not.toMatch(/^'use client'/)
    expect(newPage).not.toMatch(/^'use client'/)
    expect(editPage).not.toMatch(/^'use client'/)
    
    // Should not have event handlers
    const pages = [listPage, newPage, editPage]
    pages.forEach((page: string) => {
      expect(page).not.toContain('onChange=')
      expect(page).not.toContain('onClick=')
      expect(page).not.toContain('onSubmit=')
    })
  })

  it('should have event handlers only in Client Components', () => {
    const actions = readFileSync(join(process.cwd(), 'app/dashboard/templates/template-actions.tsx'), 'utf-8')
    const selector = readFileSync(join(process.cwd(), 'app/dashboard/templates/new/starter-selector.tsx'), 'utf-8')
    const builder = readFileSync(join(process.cwd(), 'app/dashboard/templates/[id]/builder.tsx'), 'utf-8')
    
    // Should be Client Components
    expect(actions).toMatch(/^'use client'/)
    expect(selector).toMatch(/^'use client'/)
    expect(builder).toMatch(/^'use client'/)
  })
})
