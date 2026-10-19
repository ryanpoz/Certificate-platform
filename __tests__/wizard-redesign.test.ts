/**
 * Tests for wizard redesign: sidebar + inline editor (single Design step)
 * Plus regression test for auto-advance bug
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Wizard Bug - Regression Test', () => {
  it('should prevent auto-advance from Design to People step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // handleNextToPeople should prevent default form submission
    expect(wizard).toContain('handleNextToPeople')
    expect(wizard).toContain('e.preventDefault()')
    
    // Button should have explicit type="button" to prevent form submit
    expect(wizard).toContain('type="button"')
  })

  it('should require explicit button click to advance steps', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Next button should have onClick handler
    expect(wizard).toContain('onClick={handleNextToPeople}')
    
    // Should NOT auto-call setStep without user action
    expect(wizard).not.toContain('useEffect(() => { setStep')
  })

  it('should validate certificate name before advancing', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Must check certificate name is not empty
    expect(wizard).toContain('certificateName.trim()')
    expect(wizard).toContain('Please enter a certificate name')
  })
})

describe('Wizard Redesign - Horizontal Template Strip Layout', () => {
  it('should use horizontal template strip above editor', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have horizontal layout
    expect(wizard).toContain('flex flex-col')
    expect(wizard).toContain('Horizontal Template')
    
    // Should NOT have left sidebar (no flex-shrink-0 with border-r)
    expect(wizard).not.toContain('flex-shrink-0 flex flex-col border-r')
    expect(wizard).not.toContain('Left Sidebar')
  })

  it('should have certificate name, templates, and Next in top bar', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Top bar should contain all elements
    expect(wizard).toContain('Certificate name')
    expect(wizard).toContain('Templates')
    expect(wizard).toContain('Next: Add Recipients')
    
    // Should be in same row
    expect(wizard).toContain('flex items-center')
  })

  it('should make templates horizontally scrollable', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have horizontal scroll
    expect(wizard).toContain('overflow-x-auto')
    expect(wizard).toContain('flex gap-2')
  })

  it('should give editor full width', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Editor should be full width (no sidebar taking space)
    expect(wizard).toContain('flex-1 overflow-hidden')
    expect(wizard).toContain('Full-Width Editor')
  })

  it('should show template thumbnails in strip', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should map templates horizontally
    expect(wizard).toContain('STARTER_TEMPLATES.map')
    expect(wizard).toContain('flex-shrink-0')
    expect(wizard).toContain('/templates/')
  })
})

describe('Wizard Redesign - Template Switching', () => {
  it('should load template immediately when clicked', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have handleTemplateSelect function
    expect(wizard).toContain('handleTemplateSelect')
    expect(wizard).toContain('onClick={() => handleTemplateSelect(template)}')
  })

  it('should confirm before replacing if custom elements would be lost', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should track if user has made edits
    expect(wizard).toContain('hasEdits')
    expect(wizard).toContain('setHasEdits')
    
    // Should confirm before switching if custom elements exist
    expect(wizard).toContain('customElements')
    expect(wizard).toContain('confirm(')
  })

  it('should reset customDesign when switching templates', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should clear custom design on template switch
    expect(wizard).toContain('setCustomDesign(null)')
    expect(wizard).toContain('setHasEdits(false)')
  })

  it('should default to first template preloaded', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should initialize with first template
    expect(wizard).toContain('useState(STARTER_TEMPLATES[0])')
  })
})

describe('Wizard Redesign - Step Flow', () => {
  it('should have 3 steps: Design Certificate, Add Recipients, Test and Send', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Stepper should show 3 steps with exact labels
    expect(wizard).toContain('{[1, 2, 3].map')
    expect(wizard).toContain('Design Certificate')
    expect(wizard).toContain('Add Recipients')
    expect(wizard).toContain('Test and Send')
  })

  it('should advance to Add Recipients only via explicit Next button', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Next button should use exact label
    expect(wizard).toContain('Next: Add Recipients')
    expect(wizard).toContain('handleNextToPeople')
    
    // Should require certificate name
    expect(wizard).toContain('certificateName.trim()')
  })

  it('should carry customDesign through to issuance', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should use customDesign when issuing
    expect(wizard).toContain('customDesign || selectedTemplate.config')
    expect(wizard).toContain('createCertificateFromWizard')
  })

  it('should NOT have separate fullscreen editor step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should NOT have editor overlay
    expect(wizard).not.toContain('showEditor')
    expect(wizard).not.toContain('Skip customization')
  })
})

describe('Wizard Redesign - Editor Integration', () => {
  it('should track when user makes edits', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have hasEdits state
    expect(wizard).toContain('hasEdits')
    expect(wizard).toContain('useState(false)')
  })

  it('should save customDesign on editor save', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have handleEditorSave
    expect(wizard).toContain('handleEditorSave')
    expect(wizard).toContain('setCustomDesign(design)')
  })

  it('should show all 12 designer templates in sidebar', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should map over all templates
    expect(wizard).toContain('STARTER_TEMPLATES.map')
    expect(wizard).toContain('template.id')
    expect(wizard).toContain('template.name')
  })
})

describe('Wizard Redesign - Responsive Design', () => {
  it('should have minimum height for editor', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should set minimum height
    expect(wizard).toContain('min-h-[700px]')
  })

  it('should make editor scrollable if needed', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Editor pane should handle overflow
    expect(wizard).toContain('overflow-hidden')
  })

  it('should make sidebar scrollable', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Sidebar template list should scroll
    expect(wizard).toContain('overflow-y-auto')
  })
})

describe('Wizard Redesign - UI Details', () => {
  it('should show template preview thumbnails', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should show SVG previews
    expect(wizard).toContain('/templates/${template.id}.svg')
    expect(wizard).toContain('<img')
  })

  it('should highlight selected template', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should apply different styles to selected
    expect(wizard).toContain('selectedTemplate.id === template.id')
    expect(wizard).toContain('border-blue-600')
  })

  it('should show customization indicator in review step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should show "(customized)" if design was edited
    expect(wizard).toContain('customDesign &&')
    expect(wizard).toContain('(customized)')
  })
})
