/**
 * Tests for certificate wizard template preview improvements
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { existsSync } from 'fs'

describe('Certificate Wizard - Fabric template catalog', () => {
  it('should embed Fabric editor with start-screen catalog', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('FabricEditorClient')
    expect(wizard).toContain('mode="wizard"')
    expect(wizard).not.toContain('src={previewPath}')
    expect(wizard).not.toContain('VisualEditor')
  })

  it('should keep SVG files available for legacy assets', () => {
    const templateIds = [
      'bold-pop-blocks',
      'classic-formal',
      'dark-mode-tech',
      'elegant-serif-sage',
      'geometric-bauhaus',
      'minimal-swiss',
      'modern-saas-gradient',
      'portrait-academy-diploma',
      'portrait-emerald-art-deco',
      'portrait-gradient-hex-badge',
      'rosette-badge-ribbon',
      'split-panel-navy',
    ]
    
    templateIds.forEach(id => {
      const svgPath = join(process.cwd(), `public/templates/${id}.svg`)
      expect(existsSync(svgPath)).toBe(true)
    })
  })

  it('should show Fabric editor integrated in the Design step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('FabricEditorClient')
    expect(wizard).toContain('Full-Width Fabric Editor')
  })

  it('should maintain wizard state when customizing', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('customDesign')
    expect(wizard).toContain('setCustomDesign')
    expect(wizard).toContain('certificateName')
    expect(wizard).toContain('setCertificateName')
  })

  it('should require certificate name before advancing', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('certificateName.trim()')
    expect(wizard).toContain('Please enter a certificate name')
  })
})

describe('Template Preview Display', () => {
  it('should rely on Fabric catalog for template previews', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    expect(wizard).toContain('FabricEditorClient')
    expect(editor).toContain('getTemplateCatalog')
    expect(editor).toContain('Start blank')
  })

  it('should show Fabric design status in the review step', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('Fabric design')
    expect(wizard).toContain('customDesign')
  })

  it('should pass initialConfig into Fabric for draft restore', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    expect(wizard).toContain('initialConfig={customDesign}')
    expect(wizard).toContain('templateConfig?.version === 3')
  })
})
