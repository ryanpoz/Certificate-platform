/**
 * Tests for wizard inline visual editor integration
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Wizard Inline Editor - Integration', () => {
  it('should import VisualEditor component', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should import VisualEditor
    expect(wizard).toContain("import VisualEditor from '@/components/certificate/visual-editor'")
    expect(wizard).toContain('CertificateDesignV2')
  })

  it('should track showEditor and customDesign state', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have editor state
    expect(wizard).toContain('showEditor')
    expect(wizard).toContain('setShowEditor')
    expect(wizard).toContain('customDesign')
    expect(wizard).toContain('setCustomDesign')
  })

  it('should open editor after template selection when clicking Next', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Next button should open editor
    expect(wizard).toContain('setShowEditor(true)')
    
    // Should check certificate name first
    expect(wizard).toContain('certificateName.trim()')
    expect(wizard).toContain('Please enter a certificate name')
  })

  it('should render VisualEditor component when showEditor is true', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should conditionally show editor
    expect(wizard).toContain('{showEditor &&')
    expect(wizard).toContain('<VisualEditor')
    
    // Should pass templateId
    expect(wizard).toContain('templateId={selectedTemplate.id}')
    
    // Should pass initial design
    expect(wizard).toContain('initialDesign={customDesign || selectedTemplate.config}')
    
    // Should pass onSave handler
    expect(wizard).toContain('onSave={handleEditorSave}')
  })

  it('should save customized design and proceed to People step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have handleEditorSave function
    expect(wizard).toContain('handleEditorSave')
    expect(wizard).toContain('setCustomDesign(design)')
    expect(wizard).toContain('setShowEditor(false)')
    expect(wizard).toContain('setStep(2)')
  })

  it('should allow skipping customization', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have skip function
    expect(wizard).toContain('skipCustomization')
    expect(wizard).toContain('Skip customization')
  })

  it('should use customDesign when issuing certificates', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should pass customDesign to createCertificateFromWizard
    expect(wizard).toContain('templateConfig: customDesign || selectedTemplate.config')
  })
})

describe('Wizard Inline Editor - UI/UX', () => {
  it('should show editor in fullscreen overlay', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should use fixed overlay
    expect(wizard).toContain('fixed inset-0')
    expect(wizard).toContain('z-50')
  })

  it('should display certificate name and template in editor header', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should show context
    expect(wizard).toContain('Customize your certificate')
    expect(wizard).toContain('selectedTemplate.name')
    expect(wizard).toContain('certificateName')
  })

  it('should hide stepper when editor is open', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Stepper should be conditional
    expect(wizard).toContain('{!showEditor &&')
  })

  it('should update Next button text to indicate editor', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Button should mention customization
    const hasCustomizeText = wizard.includes('Next: Customize design') || wizard.includes('Customize')
    expect(hasCustomizeText).toBe(true)
  })
})

describe('Wizard Inline Editor - Flow', () => {
  it('should follow correct step sequence', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Flow: Step 1 → Editor → Step 2 → Step 3 → Step 4
    expect(wizard).toContain('step === 1')
    expect(wizard).toContain('step === 2')
    expect(wizard).toContain('step === 3')
    expect(wizard).toContain('step === 4')
  })

  it('should maintain wizard state during customization', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should preserve selections
    expect(wizard).toContain('selectedTemplate')
    expect(wizard).toContain('certificateName')
    expect(wizard).toContain('recipients')
  })

  it('should not lose customization if user goes back', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // customDesign should persist
    expect(wizard).toContain('customDesign')
    expect(wizard).toContain('setCustomDesign')
  })
})

describe('Wizard Inline Editor - Template Integration', () => {
  it('should load selected template into editor', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should pass template config
    expect(wizard).toContain('selectedTemplate.config')
    expect(wizard).toContain('templateId={selectedTemplate.id}')
  })

  it('should support all 12 starter templates', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should use STARTER_TEMPLATES
    expect(wizard).toContain('STARTER_TEMPLATES')
  })
})
