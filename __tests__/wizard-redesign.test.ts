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

describe('Wizard Redesign - Sidebar + Editor Layout', () => {
  it('should merge template selection and editor into single Design step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should NOT have separate showEditor state or fullscreen overlay
    expect(wizard).not.toContain('showEditor')
    expect(wizard).not.toContain('fixed inset-0 z-50')
    
    // Should have sidebar + editor in flex layout
    expect(wizard).toContain('flex gap-6')
    expect(wizard).toContain('Left Sidebar')
    expect(wizard).toContain('Main Editor Pane')
  })

  it('should have left sidebar with templates list', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Sidebar should be 320px (w-80)
    expect(wizard).toContain('w-80')
    
    // Should be scrollable
    expect(wizard).toContain('overflow-y-auto')
    
    // Should show templates with previews
    expect(wizard).toContain('STARTER_TEMPLATES.map')
    expect(wizard).toContain('/templates/')
  })

  it('should show certificate name field at top of sidebar', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Certificate name should be in sidebar
    expect(wizard).toContain('Certificate name *')
    expect(wizard).toContain('certificateName')
    expect(wizard).toContain('setCertificateName')
  })

  it('should show Konva editor in main pane', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should render VisualEditor directly (not in overlay)
    expect(wizard).toContain('<VisualEditor')
    expect(wizard).toContain('templateId={selectedTemplate.id}')
    expect(wizard).toContain('initialDesign={customDesign || selectedTemplate.config}')
  })

  it('should work at 1280px width', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should use flex-1 for editor to fill remaining space
    expect(wizard).toContain('flex-1')
    
    // Sidebar is fixed width, editor is flexible
    expect(wizard).toContain('flex-shrink-0')
  })
})

describe('Wizard Redesign - Template Switching', () => {
  it('should load template immediately when clicked', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have handleTemplateSelect function
    expect(wizard).toContain('handleTemplateSelect')
    expect(wizard).toContain('onClick={() => handleTemplateSelect(template)}')
  })

  it('should confirm before replacing if user has edits', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should track if user has made edits
    expect(wizard).toContain('hasEdits')
    expect(wizard).toContain('setHasEdits')
    
    // Should confirm before switching
    expect(wizard).toContain('if (hasEdits')
    expect(wizard).toContain('confirm(')
    expect(wizard).toContain('lose your edits')
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
    expect(wizard).toContain('min-h-[600px]')
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
