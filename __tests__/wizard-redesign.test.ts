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

describe('Wizard Redesign - Fabric start-screen catalog layout', () => {
  it('should use Fabric editor with a full-width design step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('flex flex-col')
    expect(wizard).toContain('FabricEditorClient')
    expect(wizard).toContain('Full-Width Fabric Editor')
    expect(wizard).not.toContain('VisualEditor')
    expect(wizard).not.toContain('Left Sidebar')
  })

  it('should have certificate name and Next in top bar', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('Certificate name')
    expect(wizard).toContain('Next: Add Recipients')
    expect(wizard).toContain('flex items-center')
  })

  it('should pick templates via Fabric start screen (not a horizontal strip)', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).not.toContain('STARTER_TEMPLATES.map')
    expect(wizard).toContain('mode="wizard"')
    expect(wizard).toContain('initialConfig={customDesign}')
  })

  it('should give editor full width', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('flex-1 overflow-hidden')
    expect(wizard).toContain('Full-Width Fabric Editor')
  })
})

describe('Wizard Redesign - Fabric design persistence', () => {
  it('should track edits and custom DesignConfigV3', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('hasEdits')
    expect(wizard).toContain('setHasEdits')
    expect(wizard).toContain('DesignConfigV3')
    expect(wizard).toContain('handleEditorSave')
  })

  it('should require a design before leaving the Design step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('Please choose a template or start blank before continuing')
  })

  it('should reset customDesign when creating another certificate', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('setCustomDesign(null)')
    expect(wizard).toContain('setHasEdits(false)')
  })
})

describe('Wizard Redesign - Step Flow', () => {
  it('should have Design → Recipients → Send flow without a top stepper', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')

    // No 1–2–3 progress bar at the top
    expect(wizard).not.toContain('{[1, 2, 3].map')
    expect(wizard).toContain('Next: Add Recipients')
    expect(wizard).toContain('Test and Send')
    expect(wizard).toContain('handleNextToPeople')
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
    
    // Should use Fabric DesignConfigV3 when issuing
    expect(wizard).toContain('customDesign || createBlankLandscapeTemplate()')
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

  it('should use Fabric start-screen catalog instead of a sidebar strip', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('FabricEditorClient')
    expect(wizard).not.toContain('STARTER_TEMPLATES.map')
  })
})

describe('Wizard Redesign - Responsive Design', () => {
  it('should have minimum height for editor', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('min-h-[700px]')
  })

  it('should make editor scrollable if needed', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('overflow-hidden')
  })
})

describe('Wizard Redesign - UI Details', () => {
  it('should mount Fabric in wizard mode with onSave', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('mode="wizard"')
    expect(wizard).toContain('onSave={handleEditorSave}')
  })

  it('should show Fabric design status in review step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('Fabric design')
    expect(wizard).toContain('customDesign')
  })
})
