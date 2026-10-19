/**
 * Tests for certificate wizard template preview improvements
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { existsSync } from 'fs'

describe('Certificate Wizard - Template Previews', () => {
  it('should use real SVG preview images instead of colored boxes', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should use SVG previews from public/templates/
    expect(wizard).toContain('/templates/')
    expect(wizard).toContain('.svg')
    
    // Should use img tag, not colored div
    expect(wizard).toContain('<img')
    expect(wizard).toContain('src={previewPath}')
    
    // Should NOT use backgroundColor style
    expect(wizard).not.toContain('backgroundColor: bgColor')
  })

  it('should have SVG files for all starter templates', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Extract template IDs from wizard
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
    
    // Check each template has an SVG file
    templateIds.forEach(id => {
      const svgPath = join(process.cwd(), `public/templates/${id}.svg`)
      expect(existsSync(svgPath)).toBe(true)
    })
  })

  it('should show editor integrated with template selection', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should have VisualEditor component integrated (not a separate button)
    expect(wizard).toContain('VisualEditor')
    expect(wizard).toContain('Left Sidebar')
    expect(wizard).toContain('Main Editor Pane')
  })

  it('should maintain wizard state when customizing', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should track selected template
    expect(wizard).toContain('selectedTemplate')
    expect(wizard).toContain('setSelectedTemplate')
    
    // Should track certificate name
    expect(wizard).toContain('certificateName')
    expect(wizard).toContain('setCertificateName')
  })

  it('should require certificate name before customizing', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should check certificate name is entered
    expect(wizard).toContain('certificateName.trim()')
    expect(wizard).toContain('Please enter a certificate name')
  })
})

describe('Template Preview Display', () => {
  it('should use aspect ratio 1.414 for certificate preview', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should maintain A4/Letter aspect ratio
    expect(wizard).toContain('aspect-[1.414]')
  })

  it('should show template metadata', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should show template name and tags
    expect(wizard).toContain('template.name')
    expect(wizard).toContain('template.tags')
  })

  it('should highlight selected template', () => {
    const wizard = readFileSync(join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'), 'utf-8')
    
    // Should apply different styles to selected template
    expect(wizard).toContain('selectedTemplate.id === template.id')
    expect(wizard).toContain('border-blue-600')
  })
})
