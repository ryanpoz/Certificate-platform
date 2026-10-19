/**
 * Test for templates page redirect (simplified navigation)
 */

import fs from 'fs'
import path from 'path'

describe('Templates Page Navigation', () => {
  it('templates page redirects to certificates (simplified nav)', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Templates page now redirects in certificate-first UX
    expect(pageContent).toContain('redirect')
    expect(pageContent).toContain('/dashboard/certificates')
  })

  it('templates editor and creation routes still exist', () => {
    // Direct template routes are still accessible for creation/editing
    const newTemplateExists = fs.existsSync(
      path.join(process.cwd(), 'app/dashboard/templates/new/page.tsx')
    )
    const editorExists = fs.existsSync(
      path.join(process.cwd(), 'app/dashboard/templates/[id]/editor/page.tsx')
    )
    
    expect(newTemplateExists).toBe(true)
    expect(editorExists).toBe(true)
  })
})

describe('React 19 Server Component Compatibility', () => {
  it('template-actions should import Server Actions directly', () => {
    const actionsContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/template-actions.tsx'),
      'utf-8'
    )
    
    // Client component should import actions from './actions'
    expect(actionsContent).toContain("from './actions'")
    expect(actionsContent).toContain("'use client'")
  })

  it('actions file should be marked as server', () => {
    const actionsContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/actions.ts'),
      'utf-8'
    )
    
    expect(actionsContent).toContain("'use server'")
  })
})
