/**
 * Free-plan growth loop: verification page, share prompt, Verified-by footer, PDF verify strip.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { buildSharePostText, buildShareLinks, shortVerifyLink, firstName } from '@/lib/growth/share'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

describe('share helpers', () => {
  const certificateUrl = 'https://example.com/c/ABC-1234-5678'

  it('builds a first-person post with the verify link', () => {
    const text = buildSharePostText({ courseName: 'First Aid', academyName: 'Acme Training', certificateUrl })
    expect(text).toContain('First Aid certificate from Acme Training')
    expect(text).toContain(certificateUrl)
  })

  it('builds prefilled share links for each channel', () => {
    const links = buildShareLinks({ certificateUrl, postText: 'Hello & welcome', courseName: 'First Aid', academyName: 'Acme' })
    expect(links.linkedin_post).toContain('linkedin.com/feed/?shareActive=true&text=Hello%20%26%20welcome')
    expect(links.x).toContain('twitter.com/intent/tweet')
    expect(links.x).toContain(encodeURIComponent(certificateUrl))
    expect(links.facebook).toContain('facebook.com/sharer/sharer.php?u=')
    expect(links.email).toMatch(/^mailto:\?subject=/)
  })

  it('shortens the verify link for display', () => {
    expect(shortVerifyLink('https://example.com/c/ABC-1234-5678?utm_source=qr')).toBe('example.com/c/ABC-1234-5678')
    expect(shortVerifyLink('not a url')).toBe('not a url')
  })

  it('greets recipients by first name', () => {
    expect(firstName('  Jane  Smith ')).toBe('Jane')
  })
})

describe('public verification page', () => {
  const view = read('app/c/[number]/certificate-view.tsx')

  it('shows the verified status, short link and QR code', () => {
    expect(view).toContain('Verified · Valid')
    expect(view).toContain('shortVerifyLink(certificateUrl)')
    expect(view).toContain('<QRCodeDisplay url={qrUrl} />')
  })

  it('keeps Add to LinkedIn and adds share links', () => {
    expect(view).toContain('Add to LinkedIn')
    expect(view).toContain("trackAction('linkedin_add_click')")
    expect(view).toContain('<SharePanel')
  })

  it('shows the post-claim share prompt only to recipients of valid certificates', () => {
    expect(view).toContain("isRecipient && certificate.status === 'valid'")
    expect(view).toContain('<ClaimPrompt')
    const prompt = read('app/c/[number]/claim-prompt.tsx')
    expect(prompt).toContain('Suggested post')
    expect(prompt).toContain('Add to LinkedIn profile')
    expect(prompt).toContain('localStorage')
  })

  it('ends with a Verified by footer and a signup call to action', () => {
    expect(view).toContain('<VerifiedByFooter')
    const footer = read('app/c/[number]/verified-by-footer.tsx')
    expect(footer).toContain('Verified by {BRAND.name}')
    expect(footer).toContain('Create your first certificate')
  })

  it('avoids course-creator platform positioning', () => {
    const copy = [
      view,
      read('app/c/[number]/claim-prompt.tsx'),
      read('app/c/[number]/verified-by-footer.tsx'),
    ].join('\n').toLowerCase()
    expect(copy).not.toContain('course creator')
    expect(copy).not.toContain('online course')
    expect(copy).not.toContain('sell your course')
  })
})

describe('PDF and email carry the loop', () => {
  it('adds a QR + short-link verify strip to designed PDFs', () => {
    const gen = read('lib/pdf/generator.ts')
    expect(gen).toContain('export function buildVerifyStrip')
    expect(gen).toContain('buildVerifyStrip(qrCodeDataUrl, params.certificateUrl)')
  })

  it('adds a Verified by footer with a signup link to certificate emails', () => {
    const email = read('lib/email/resend.ts')
    expect(email).toContain('Verified by ${BRAND.name}')
    expect(email).toContain('Create your first certificate')
  })
})
