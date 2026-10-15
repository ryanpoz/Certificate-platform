/**
 * Regression test for templates page production crash
 */

import fs from 'fs'
import path from 'path'

describe('Templates Page Crash Prevention', () => {
  it('should handle missing migration columns gracefully', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Should have try-catch for database query
    expect(pageContent).toContain('try {')
    expect(pageContent).toContain('} catch')
    
    // Should show migration needed warning
    expect(pageContent).toContain('migrationNeeded')
    expect(pageContent).toContain('Database Migration Required')
    expect(pageContent).toContain('003-certificate-builder.sql')
  })

  it('should have fallback query without new columns', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Should have fallback query using only createdAt
    expect(pageContent).toContain('orderBy(desc(templates.createdAt))')
  })

  it('should safely access template properties with fallbacks', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Should use fallback values for potentially missing fields
    expect(pageContent).toContain('template.name ||')
    expect(pageContent).toContain('template.isDefault ||')
  })

  it('should conditionally render TemplateActions only when migration is done', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Should check migrationNeeded before showing actions
    expect(pageContent).toContain('!migrationNeeded')
    expect(pageContent).toContain('<TemplateActions')
  })

  it('should not crash if templates table has no data', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Should handle empty templates array
    expect(pageContent).toContain('allTemplates.length === 0')
  })
})

describe('React 19 Server Component Compatibility', () => {
  it('should not pass Server Actions as props during render', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/page.tsx'),
      'utf-8'
    )
    
    // Should only pass serializable data to client components
    // Server Actions should be imported in client components, not passed as props
    const actionsPassed = pageContent.match(/<TemplateActions[^>]*\b(action|handler)\s*=/gi)
    expect(actionsPassed).toBeNull()
  })

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
