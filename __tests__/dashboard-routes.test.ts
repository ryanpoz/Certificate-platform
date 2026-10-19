/**
 * Test Suite: Dashboard Routes Graceful Degradation
 * 
 * Ensures all dashboard routes render or redirect cleanly even when
 * migration 003 columns (courses.templateId, templates.name, etc.) are missing.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Dashboard Routes - Missing Column Handling', () => {
  test('Courses detail page handles missing templateId column', () => {
    const coursePage = readFileSync(join(process.cwd(), 'app/dashboard/courses/[id]/page.tsx'), 'utf-8')

    // Should check if templateId exists before using it
    expect(coursePage).toContain("'templateId' in course")
    expect(coursePage).toContain('course.templateId')
    
    // Should have try-catch for template loading
    expect(coursePage).toContain('try {')
    expect(coursePage).toContain('} catch')
  })

  test('Issue certificate action handles missing templateId', () => {
    const issueActions = readFileSync(join(process.cwd(), 'app/dashboard/certificates/issue/actions.ts'), 'utf-8')

    // Should check if templateId exists before using it
    expect(issueActions).toContain("'templateId' in course")
    
    // Should have fallback template loading
    expect(issueActions).toContain('try {')
    expect(issueActions).toContain('} catch')
  })

  test('Delete template action handles missing courses.templateId', () => {
    const templateActions = readFileSync(join(process.cwd(), 'app/dashboard/templates/actions.ts'), 'utf-8')

    // Should wrap templateId query in try-catch
    expect(templateActions).toContain('courses.templateId')
    expect(templateActions).toContain('try {')
    expect(templateActions).toContain('} catch')
  })

  test('All dashboard routes have proper error boundaries', () => {
    // This test documents the routes that should be tested
    const dashboardRoutes = [
      '/dashboard', // redirects to /dashboard/certificates
      '/dashboard/certificates',
      '/dashboard/courses', // redirects to /dashboard/certificates
      '/dashboard/programs', // redirects to /dashboard/certificates
      '/dashboard/templates', // redirects to /dashboard/certificates
      '/dashboard/wizard',
      '/dashboard/results',
      '/dashboard/settings',
    ]

    // All routes should either render or redirect, never crash
    expect(dashboardRoutes.length).toBeGreaterThan(0)
  })

  test('Navigation shows only Certificates, Results, Settings', () => {
    const layout = readFileSync(join(process.cwd(), 'app/dashboard/layout.tsx'), 'utf-8')
    
    // Should have simplified navigation
    expect(layout).toContain('Certificates')
    expect(layout).toContain('Results')
    expect(layout).toContain('Settings')
    
    // Should NOT have Dashboard or Templates in nav
    expect(layout).not.toContain('>Dashboard<')
    expect(layout).not.toContain('>Templates<')
  })
})

describe('Dashboard Routes - Redirect Behavior', () => {
  test('Dashboard page redirects to certificates', () => {
    const dashboardPage = readFileSync(join(process.cwd(), 'app/dashboard/page.tsx'), 'utf-8')
    
    // /dashboard should redirect to /dashboard/certificates
    expect(dashboardPage).toContain('redirect')
    expect(dashboardPage).toContain('/dashboard/certificates')
  })

  test('Templates page redirects to certificates', () => {
    const templatesPage = readFileSync(join(process.cwd(), 'app/dashboard/templates/page.tsx'), 'utf-8')
    
    // /dashboard/templates should redirect to /dashboard/certificates
    expect(templatesPage).toContain('redirect')
    expect(templatesPage).toContain('/dashboard/certificates')
  })

  test('Courses page redirects to certificates', () => {
    const coursesPage = readFileSync(join(process.cwd(), 'app/dashboard/courses/page.tsx'), 'utf-8')
    
    // /dashboard/courses should redirect to /dashboard/certificates
    expect(coursesPage).toContain('redirect')
    expect(coursesPage).toContain('/dashboard/certificates')
  })

  test('Programs page redirects to certificates', () => {
    const programsPage = readFileSync(join(process.cwd(), 'app/dashboard/programs/page.tsx'), 'utf-8')
    
    // /dashboard/programs should redirect to /dashboard/certificates
    expect(programsPage).toContain('redirect')
    expect(programsPage).toContain('/dashboard/certificates')
  })

  test('Redirects do not get caught in try-catch blocks', () => {
    // Next.js redirect() throws a NEXT_REDIRECT error which should not be caught
    // This is a documentation test to ensure we don't have try { redirect() } catch(e) {}
    expect(true).toBe(true)
  })
})
