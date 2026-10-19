/**
 * Tests for split metrics: Recipient Progress and Share Impact
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Split Metrics - Recipient Progress', () => {
  it('should have RecipientProgress component for certificate pages', () => {
    const component = readFileSync(join(process.cwd(), 'app/dashboard/courses/[id]/recipient-progress.tsx'), 'utf-8')
    
    // Should fetch issued certificates
    expect(component).toContain('certificates.isPreview')
    expect(component).toContain('certificates.courseId')
    
    // Should calculate funnel metrics
    expect(component).toContain('email_delivered')
    expect(component).toContain('page_view')
    expect(component).toContain('linkedin_add_click')
    expect(component).toContain('pdf_download')
    
    // Should check for recipient views
    expect(component).toContain('isRecipient')
    
    // Should show recipient table
    expect(component).toContain('Recipients')
    expect(component).toContain('Furthest Stage')
  })

  it('should integrate RecipientProgress into certificate detail page', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/courses/[id]/page.tsx'), 'utf-8')
    
    expect(page).toContain('RecipientProgress')
    expect(page).toContain('courseId={course.id}')
  })

  it('should avoid division by zero in percentages', () => {
    const component = readFileSync(join(process.cwd(), 'app/dashboard/courses/[id]/recipient-progress.tsx'), 'utf-8')
    
    // Should check if denominator > 0 before division
    expect(component).toContain('issued > 0')
  })

  it('should have tooltips for each metric', () => {
    const component = readFileSync(join(process.cwd(), 'app/dashboard/courses/[id]/recipient-progress.tsx'), 'utf-8')
    
    // Should have description tooltips
    expect(component).toContain('description')
    expect(component).toContain('Certificates created and published')
    expect(component).toContain('Recipients who opened and viewed')
  })
})

describe('Split Metrics - Share Impact', () => {
  it('should have ShareImpact component for Results page', () => {
    const component = readFileSync(join(process.cwd(), 'app/dashboard/results/share-impact.tsx'), 'utf-8')
    
    // Should separate audience views from recipient views
    expect(component).toContain('audienceViews')
    expect(component).toContain('!e.meta || !(e.meta as any).isRecipient')
    
    // Should categorize by source
    expect(component).toContain('fromLinkedIn')
    expect(component).toContain('fromTwitter')
    expect(component).toContain('linkedin.com')
    expect(component).toContain('twitter.com')
    expect(component).toContain('utm_source')
    
    // Should calculate CTR
    expect(component).toContain('ctr')
    expect(component).toContain('audienceViews.length > 0')
    
    // Should show per-certificate breakdown
    expect(component).toContain('Per-Certificate Breakdown')
  })

  it('should integrate ShareImpact into Results page', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/results/page.tsx'), 'utf-8')
    
    expect(page).toContain('ShareImpact')
    expect(page).toContain('academyId={user.academyId}')
    expect(page).toContain('startDate={startDate}')
    expect(page).toContain('endDate={endDate}')
  })

  it('should have tooltips for all metrics', () => {
    const component = readFileSync(join(process.cwd(), 'app/dashboard/results/share-impact.tsx'), 'utf-8')
    
    // Should have description tooltips
    expect(component).toContain('description')
    expect(component).toContain('Visits from shared links')
    expect(component).toContain('Click-through rate')
  })

  it('should avoid division by zero for CTR', () => {
    const component = readFileSync(join(process.cwd(), 'app/dashboard/results/share-impact.tsx'), 'utf-8')
    
    // Should check audience views > 0
    expect(component).toContain('audienceViews.length > 0')
  })
})

describe('Event Tracking Updates', () => {
  it('should track recipient vs audience views', () => {
    const viewComponent = readFileSync(join(process.cwd(), 'app/c/[number]/certificate-view.tsx'), 'utf-8')
    
    // Should detect recipient parameter
    expect(viewComponent).toContain('recipient')
    expect(viewComponent).toContain('isRecipient')
  })

  it('should store isRecipient in event meta', () => {
    const trackingApi = readFileSync(join(process.cwd(), 'app/api/events/track/route.ts'), 'utf-8')
    
    // Should accept isRecipient parameter
    expect(trackingApi).toContain('isRecipient')
    
    // Should store in meta field
    expect(trackingApi).toContain('meta')
    expect(trackingApi).toContain('isRecipient: true')
  })

  it('should add recipient=true to email certificate links', () => {
    const email = readFileSync(join(process.cwd(), 'lib/email/resend.ts'), 'utf-8')
    
    // Email link should include recipient=true parameter
    expect(email).toContain('?recipient=true')
  })
})

describe('Metrics - No Blended Funnel Overview', () => {
  it('should not have old ResultsMetrics component on Results page', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/results/page.tsx'), 'utf-8')
    
    // Should not use old metrics component
    expect(page).not.toContain('<ResultsMetrics')
    expect(page).not.toContain('ResultsMetrics from')
  })

  it('Results page should focus on Share Impact only', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/results/page.tsx'), 'utf-8')
    
    // Should describe Share Impact focus
    const hasShareImpact = page.includes('Share Impact') || page.includes('sharing')
    expect(hasShareImpact).toBe(true)
  })
})
