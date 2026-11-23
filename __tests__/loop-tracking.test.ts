/**
 * Growth-loop tracking: link tags, event whitelist, signup attribution, issuer counts.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  isShareChannel,
  isTrackableEvent,
  normalizeRef,
  resolveViewSource,
  signupRefUrl,
  summarizeLoopEvents,
  tagCertificateUrl,
} from '@/lib/growth/tracking'
import { buildShareLinks } from '@/lib/growth/share'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')
const certificateUrl = 'https://example.com/c/ABC-1234-5678'

describe('link tagging', () => {
  it('adds utm_source and utm_medium', () => {
    expect(tagCertificateUrl(certificateUrl, 'qr')).toBe(`${certificateUrl}?utm_source=qr&utm_medium=certificate`)
    expect(tagCertificateUrl(certificateUrl, 'linkedin', 'profile')).toContain('utm_medium=profile')
  })

  it('keeps existing query params', () => {
    expect(tagCertificateUrl(`${certificateUrl}?recipient=true`, 'email')).toContain('recipient=true&utm_source=email')
  })

  it('builds a signup link that carries the certificate ref', () => {
    expect(signupRefUrl('', 'ABC-1234-5678')).toBe('/signup?ref=ABC-1234-5678&utm_source=certificate&utm_medium=verified_by')
    expect(signupRefUrl('https://app.test/', 'ABC-1234-5678', 'certificate_email')).toBe(
      'https://app.test/signup?ref=ABC-1234-5678&utm_source=certificate_email&utm_medium=verified_by'
    )
  })

  it('tags every share channel with its own source', () => {
    const links = buildShareLinks({
      certificateUrl,
      postText: `Proud of this: ${certificateUrl}`,
      courseName: 'First Aid',
      academyName: 'Acme',
    })
    expect(decodeURIComponent(links.linkedin_post)).toContain('utm_source=linkedin_post')
    expect(decodeURIComponent(links.x)).toContain('utm_source=x')
    expect(decodeURIComponent(links.facebook)).toContain('utm_source=facebook')
    expect(decodeURIComponent(links.email)).toContain('utm_source=email')
  })
})

describe('event rules', () => {
  it('only accepts known public event types', () => {
    expect(isTrackableEvent('page_view')).toBe(true)
    expect(isTrackableEvent('verified_by_click')).toBe(true)
    expect(isTrackableEvent('signup_attributed')).toBe(false)
    expect(isTrackableEvent('billable_certificate_deleted')).toBe(false)
    expect(isTrackableEvent('anything')).toBe(false)
  })

  it('only accepts known share channels', () => {
    expect(isShareChannel('linkedin_post')).toBe(true)
    expect(isShareChannel('myspace')).toBe(false)
  })

  it('resolves a view source from the tag, then the referrer', () => {
    expect(resolveViewSource('qr', 'https://www.linkedin.com/')).toBe('qr')
    expect(resolveViewSource(null, 'https://www.linkedin.com/feed/')).toBe('linkedin')
    expect(resolveViewSource('bogus', 'https://t.co/xyz')).toBe('x')
    expect(resolveViewSource(null, '')).toBe('direct')
    expect(resolveViewSource(null, 'https://news.example.org')).toBe('other')
  })

  it('validates certificate refs', () => {
    expect(normalizeRef('abc-1234-5678')).toBe('ABC-1234-5678')
    expect(normalizeRef("x'; drop table")).toBeNull()
    expect(normalizeRef(undefined)).toBeNull()
  })
})

describe('summarizeLoopEvents', () => {
  it('rolls up views by source, shares by channel and click counts', () => {
    const summary = summarizeLoopEvents([
      { type: 'page_view', key: 'linkedin', count: 5 },
      { type: 'page_view', key: 'qr', count: 2 },
      { type: 'page_view', key: null, count: 3 },
      { type: 'share_click', key: 'x', count: 1 },
      { type: 'share_click', key: 'linkedin_post', count: 4 },
      { type: 'share_click', key: 'bogus', count: 9 },
      { type: 'linkedin_add_click', key: null, count: 6 },
      { type: 'verified_by_click', key: null, count: 2 },
    ])
    expect(summary.totalViews).toBe(10)
    expect(summary.viewsBySource[0]).toEqual({ source: 'linkedin', label: 'LinkedIn profile', count: 5 })
    expect(summary.viewsBySource.find((v) => v.source === 'other')?.count).toBe(3)
    expect(summary.totalShares).toBe(5)
    expect(summary.sharesByChannel[0].channel).toBe('linkedin_post')
    expect(summary.linkedinAdds).toBe(6)
    expect(summary.verifiedByClicks).toBe(2)
  })

  it('handles no events', () => {
    const summary = summarizeLoopEvents([])
    expect(summary.totalViews).toBe(0)
    expect(summary.viewsBySource).toEqual([])
  })
})

describe('wiring', () => {
  it('tracking endpoint whitelists events and stores source and channel', () => {
    const route = read('app/api/events/track/route.ts')
    expect(route).toContain('isTrackableEvent(type)')
    expect(route).toContain('isShareChannel(channel)')
    expect(route).toContain('resolveViewSource(utmSource, safeReferrer)')
    expect(route).toContain('isRecipient: true')
  })

  it('verification page tags QR, LinkedIn, copy and Verified-by links', () => {
    const view = read('app/c/[number]/certificate-view.tsx')
    expect(view).toContain("tagCertificateUrl(certificateUrl, 'qr')")
    expect(view).toContain("tagCertificateUrl(certificateUrl, 'linkedin', 'profile')")
    expect(view).toContain("tagCertificateUrl(certificateUrl, 'copy')")
    expect(view).toContain('signupRefUrl(\'\', certificate.number)')
    expect(view).toContain("trackAction('verified_by_click')")
    expect(view).toContain("utmSource: urlParams.get('utm_source')")
  })

  it('email links are tagged', () => {
    const email = read('lib/email/resend.ts')
    expect(email).toContain('?recipient=true&utm_source=email&utm_medium=certificate')
    expect(email).toContain("tagCertificateUrl(params.certificateUrl, 'linkedin', 'profile')")
    expect(email).toContain("signupRefUrl(appOrigin, params.certificateNumber, 'certificate_email')")
  })

  it('PDF QR codes are tagged', () => {
    const gen = read('lib/pdf/generator.ts')
    expect(gen).not.toContain('QRCode.toDataURL(params.certificateUrl')
    expect(gen).toContain("QRCode.toDataURL(tagCertificateUrl(params.certificateUrl, 'qr')")
  })

  it('attributes email and Google signups to the referring certificate', () => {
    expect(read('app/(marketing)/signup/form.tsx')).toContain('REF_COOKIE')
    expect(read('app/(marketing)/signup/actions.ts')).toContain("recordAttributedSignup(ref, academy.id, 'email')")
    expect(read('app/auth/google/callback/route.ts')).toContain("recordAttributedSignup(ref, academy.id, 'google')")
    const attribution = read('lib/growth/attribution.ts')
    expect(attribution).toContain('SIGNUP_ATTRIBUTED_EVENT')
    expect(attribution).toContain('normalizeRef(ref)')
  })

  it('shows loop counts on the Results page without attributed signups', () => {
    expect(read('app/dashboard/results/page.tsx')).toContain('<LoopActivity')
    const loop = read('app/dashboard/results/loop-activity.tsx')
    expect(loop).toContain('summarizeLoopEvents(rows)')
    expect(loop).not.toContain("'signup_attributed'")
  })
})
