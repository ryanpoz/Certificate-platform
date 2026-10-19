import { readFileSync } from 'fs'
import { join } from 'path'

describe('Fabric.js Prototype - Smoke Tests', () => {
  it('should have fabric lab page at correct route', () => {
    const page = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/page.tsx'),
      'utf-8'
    )
    
    // Should be a server component (async) for auth
    expect(page).toContain('async function FabricLabPage')
    expect(page).toContain('requireAuth')
    
    // Should use ClientWrapper
    expect(page).toContain('ClientWrapper')
  })

  it('should have client wrapper with dynamic import', () => {
    const wrapper = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/client-wrapper.tsx'),
      'utf-8'
    )
    
    // Should be a client component
    expect(wrapper).toContain("'use client'")
    
    // Should use dynamic import with ssr:false
    expect(wrapper).toContain('dynamic(')
    expect(wrapper).toContain('ssr: false')
    expect(wrapper).toContain('fabric-editor')
  })

  it('should have fabric editor component with key features', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should be client component
    expect(editor).toContain("'use client'")
    
    // Should import from fabric
    expect(editor).toContain('from \'fabric\'')
    
    // Should have 2 templates
    expect(editor).toContain('modern-saas-gradient')
    expect(editor).toContain('portrait-academy-diploma')
    
    // Should have key features
    expect(editor).toContain('Double-click')
    expect(editor).toContain('Export PNG')
    expect(editor).toContain('Export JSON')
    expect(editor).toContain('Test Long Name')
    expect(editor).toContain('Show field names')
    expect(editor).toContain('Undo')
    expect(editor).toContain('Redo')
    
    // Should have floating toolbar
    expect(editor).toContain('Floating Toolbar')
    expect(editor).toContain('fontFamily')
    expect(editor).toContain('fontSize')
  })

  it('should handle template switching', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should have template state
    expect(editor).toContain('selectedTemplate')
    expect(editor).toContain('setSelectedTemplate')
    
    // Should have loadTemplate function
    expect(editor).toContain('loadTemplate')
  })

  it('should support text editing features', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should have IText/Textbox
    expect(editor).toContain('IText')
    expect(editor).toContain('Textbox')
    
    // Should handle double-click
    expect(editor).toContain('mouse:dblclick')
    expect(editor).toContain('enterEditing')
    
    // Should have shrink-to-fit logic
    expect(editor).toContain('shrinkToFit')
  })

  it('should have undo/redo functionality', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should track history
    expect(editor).toContain('history')
    expect(editor).toContain('historyIndex')
    expect(editor).toContain('saveHistory')
    expect(editor).toContain('undo')
    expect(editor).toContain('redo')
  })

  it('should support multi-select, grouping, and alignment', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should track multiple selections
    expect(editor).toContain('selectedObjects')
    
    // Should have grouping functions
    expect(editor).toContain('groupSelected')
    expect(editor).toContain('ungroupSelected')
    expect(editor).toContain('Group')
    expect(editor).toContain('Ungroup')
    
    // Should have alignment functions
    expect(editor).toContain('alignSelected')
    expect(editor).toContain('Align')
    
    // Should have distribution
    expect(editor).toContain('distributeSelected')
    expect(editor).toContain('Distribute')
    
    // Should mention multi-select in help
    expect(editor).toContain('Shift+Click')
  })

  it('should have snap guides enabled', () => {
    const editor = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
      'utf-8'
    )
    
    // Should enable snap features
    expect(editor).toContain('snapAngle')
    expect(editor).toContain('snapThreshold')
  })

  it('should require authentication', () => {
    const page = readFileSync(
      join(process.cwd(), 'app/dashboard/lab/fabric/page.tsx'),
      'utf-8'
    )
    
    // Should import and call requireAuth
    expect(page).toContain('requireAuth')
    expect(page).toContain('await requireAuth()')
  })
})
