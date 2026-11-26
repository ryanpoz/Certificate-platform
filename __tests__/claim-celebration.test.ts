import { readFileSync } from 'fs'
import { join } from 'path'
import {
  celebrationCopy,
  celebrationKey,
  celebrationStyle,
  markCelebrated,
  markPromptDismissed,
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
  resolveClaimMode,
  resolveIsRecipient,
  stripRecipientParam,
  type KeyValueStore,
} from '@/lib/growth/celebration'
import { burstConfetti, makePieces, readConfettiColors, CONFETTI_COLOR_VARS } from '@/lib/growth/confetti'
import { isTrackableEvent, tagCertificateUrl } from '@/lib/growth/tracking'
import { buildShareLinks } from '@/lib/growth/share'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v
    },
  }
}

const throwingStore: KeyValueStore = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

const CERT = 'HSI-2026-0841'
const base = { status: 'valid' as const, isPreview: false, certificateNumber: CERT }

describe('Claim celebration: first view only', () => {
  it('celebrates the recipient on their first view of a valid certificate', () => {
    expect(resolveClaimMode({ ...base, isRecipient: true, storage: memoryStore() })).toBe('celebrate')
  })

  it('does not replay after the first view (static prompt instead)', () => {
    const storage = memoryStore()
    expect(resolveClaimMode({ ...base, isRecipient: true, storage })).toBe('celebrate')
    markCelebrated(storage, CERT)
    expect(storage.data[celebrationKey(CERT)]).toBe('1')
    expect(resolveClaimMode({ ...base, isRecipient: true, storage })).toBe('prompt')
    expect(resolveClaimMode({ ...base, isRecipient: true, storage })).toBe('prompt')
  })

  it('is tracked per certificate, so a second certificate still celebrates', () => {
    const storage = memoryStore()
    markCelebrated(storage, CERT)
    expect(resolveClaimMode({ ...base, certificateNumber: 'HSI-2026-0842', isRecipient: true, storage })).toBe('celebrate')
  })

  it('hides everything once dismissed, including a dismissal from the earlier share prompt', () => {
    const storage = memoryStore()
    markPromptDismissed(storage, CERT)
    expect(resolveClaimMode({ ...base, isRecipient: true, storage })).toBe('none')
    const legacy = memoryStore({ [`claim-prompt-dismissed:${CERT}`]: '1' })
    expect(resolveClaimMode({ ...base, isRecipient: true, storage: legacy })).toBe('none')
  })

  it('never celebrates expired or revoked certificates, or previews', () => {
    expect(resolveClaimMode({ ...base, status: 'expired', isRecipient: true, storage: memoryStore() })).toBe('none')
    expect(resolveClaimMode({ ...base, status: 'revoked', isRecipient: true, storage: memoryStore() })).toBe('none')
    expect(resolveClaimMode({ ...base, isPreview: true, isRecipient: true, storage: memoryStore() })).toBe('none')
  })

  it('treats a visit from an expiry reminder as a later visit, not the claim moment', () => {
    expect(resolveClaimMode({ ...base, isRecipient: true, storage: memoryStore(), medium: 'expiry_reminder' })).toBe('prompt')
    expect(resolveClaimMode({ ...base, isRecipient: true, storage: memoryStore(), medium: 'certificate' })).toBe('celebrate')
  })

  it('still works when storage is blocked (private mode)', () => {
    expect(() => markCelebrated(throwingStore, CERT)).not.toThrow()
    expect(resolveClaimMode({ ...base, isRecipient: true, storage: throwingStore })).toBe('celebrate')
    expect(resolveClaimMode({ ...base, isRecipient: false, storage: throwingStore })).toBe('none')
  })
})

describe('Claim celebration: verifiers never see it', () => {
  it('a verifier without the recipient flag gets nothing, even on a fresh device', () => {
    for (const search of ['', '?utm_source=qr', '?utm_source=linkedin_post&utm_medium=social', '?recipient=false']) {
      const isRecipient = resolveIsRecipient({ search, certificateNumber: CERT, session: memoryStore() })
      expect(isRecipient).toBe(false)
      expect(resolveClaimMode({ ...base, isRecipient, storage: memoryStore() })).toBe('none')
    }
  })

  it('recognises the recipient from the issue email link and remembers it for this tab only', () => {
    const session = memoryStore()
    expect(resolveIsRecipient({ search: '?recipient=true&utm_source=email', certificateNumber: CERT, session })).toBe(true)
    // A reload after the flag is tidied away still counts in the same tab
    expect(resolveIsRecipient({ search: '', certificateNumber: CERT, session })).toBe(true)
    // ...but not in another browser or for another certificate
    expect(resolveIsRecipient({ search: '', certificateNumber: CERT, session: memoryStore() })).toBe(false)
    expect(resolveIsRecipient({ search: '', certificateNumber: 'OTHER-1', session })).toBe(false)
  })

  it('strips the recipient flag from the address bar so copied links do not celebrate for others', () => {
    expect(stripRecipientParam('https://x.test/c/ABC?recipient=true&utm_source=email')).toBe('/c/ABC?utm_source=email')
    expect(stripRecipientParam('https://x.test/c/ABC?recipient=true')).toBe('/c/ABC')
    expect(stripRecipientParam('https://x.test/c/ABC?utm_source=qr')).toBeNull()
  })

  it('share and QR links never carry the recipient flag', () => {
    const url = 'https://x.test/c/ABC'
    const links = buildShareLinks({ certificateUrl: url, postText: `See ${url}`, courseName: 'First Aid', academyName: 'Harbour' })
    for (const href of [...Object.values(links), tagCertificateUrl(url, 'qr'), tagCertificateUrl(url, 'copy')]) {
      expect(decodeURIComponent(href)).not.toContain('recipient=')
    }
  })

  it('the public page decides on the client from the recipient flag, never from the server', () => {
    const page = read('app/c/[number]/page.tsx')
    expect(page).not.toMatch(/recipient|celebrat/i)
    const view = read('app/c/[number]/certificate-view.tsx')
    expect(view).toContain('resolveIsRecipient(')
    expect(view).toContain('stripRecipientParam(window.location.href)')
    expect(view).toContain("claimStyle !== 'none' && (")
  })
})

describe('Claim celebration: reduced motion', () => {
  const media = (matches: boolean) => ({ matchMedia: (q: string) => ({ matches: q === REDUCED_MOTION_QUERY && matches }) })

  it('detects prefers-reduced-motion', () => {
    expect(prefersReducedMotion(media(true))).toBe(true)
    expect(prefersReducedMotion(media(false))).toBe(false)
    expect(prefersReducedMotion({})).toBe(false)
    expect(prefersReducedMotion(null)).toBe(false)
  })

  it('shows the static version with reduced motion, and on later visits', () => {
    expect(celebrationStyle('celebrate', false)).toBe('animated')
    expect(celebrationStyle('celebrate', true)).toBe('static')
    expect(celebrationStyle('prompt', false)).toBe('static')
    expect(celebrationStyle('none', false)).toBe('none')
    expect(celebrationStyle('none', true)).toBe('none')
  })

  it('never draws confetti with reduced motion', () => {
    expect(burstConfetti({ reducedMotion: true })).toBeNull()
  })

  it('only fires confetti and the reveal animation in the animated variant, with CSS fallbacks', () => {
    const prompt = read('app/c/[number]/claim-prompt.tsx')
    expect(prompt).toContain("const animated = variant === 'animated'")
    expect(prompt).toMatch(/if \(!animated \|\| fired\.current\) return/)
    expect(prompt).toContain('motion-reduce:animate-none')
    const view = read('app/c/[number]/certificate-view.tsx')
    expect(view).toContain("claimStyle === 'animated' ? 'animate-cert-reveal motion-reduce:animate-none' : ''")
  })
})

describe('Claim celebration: content, sharing and tracking', () => {
  it('congratulates by first name with the certificate title', () => {
    const copy = celebrationCopy('Jordan Lee', 'Occupational First Aid — Level 2')
    expect(copy.headline).toBe('Congratulations, Jordan!')
    expect(copy.subhead).toBe("You've earned your Occupational First Aid — Level 2 certificate.")
  })

  it('leads with Share on LinkedIn using the ready-made post, plus Add to profile, other channels and the PDF', () => {
    const prompt = read('app/c/[number]/claim-prompt.tsx')
    expect(prompt).toContain('Share on LinkedIn')
    expect(prompt).toContain('href={links.linkedin_post}')
    expect(prompt).toContain("onClick={() => onShare('linkedin_post')}")
    expect(prompt).toContain('href={linkedInAddUrl}')
    expect(prompt).toContain('onClick={onAddToLinkedIn}')
    expect(prompt).toContain('href={pdfUrl}')
    expect(prompt).toContain('onClick={onDownload}')
    expect(prompt).toContain("channels={['x', 'facebook', 'email']}")
    expect(prompt).toContain("onShare('copy_text')")
    expect(prompt).not.toMatch(/unlimited/i)
  })

  it('keeps the existing share events wired up', () => {
    const view = read('app/c/[number]/certificate-view.tsx')
    expect(view).toContain("const onShare = (channel: ShareChannel) => trackAction('share_click', { channel })")
    expect(view).toContain("onAddToLinkedIn={() => trackAction('linkedin_add_click')}")
    expect(view).toContain("onDownload={() => trackAction('pdf_download')}")
  })

  it('records celebration_shown once, on the first view', () => {
    expect(isTrackableEvent('celebration_shown')).toBe(true)
    const view = read('app/c/[number]/certificate-view.tsx')
    expect(view).toContain("type: 'celebration_shown'")
    expect(view).toMatch(/if \(mode === 'celebrate'\) \{\s*fetch\('\/api\/events\/track'/)
  })

  it('uses theme tokens for its colours, so a rebrand only edits the theme', () => {
    const css = read('app/globals.css')
    for (const name of [...CONFETTI_COLOR_VARS, '--celebrate-accent', '--celebrate-glow', '--celebrate-surface']) {
      expect(css).toContain(`${name}:`)
    }
    expect(read('tailwind.config.ts')).toContain("DEFAULT: 'var(--celebrate-accent)'")
    const prompt = read('app/c/[number]/claim-prompt.tsx')
    expect(prompt).toContain('bg-celebrate-surface')
    // Only LinkedIn's own brand blue is hard-coded
    const hexes = (prompt.match(/#[0-9a-fA-F]{6}/g) ?? []).map((h) => h.toLowerCase())
    expect(hexes.every((h) => ['#0a66c2', '#004182', '#eef3f8'].includes(h))).toBe(true)
  })

  it('reads confetti colours from the theme, with a fallback', () => {
    const vars: Record<string, string> = { '--confetti-1': ' #111111 ', '--confetti-2': '#222222' }
    expect(readConfettiColors((n) => vars[n])).toEqual(['#111111', '#222222'])
    expect(readConfettiColors(() => '')).toHaveLength(5)
    const pieces = makePieces(10, 1000, 800, ['#111111', '#222222'], () => 0.5)
    expect(pieces).toHaveLength(10)
    expect(new Set(pieces.map((p) => p.color))).toEqual(new Set(['#111111', '#222222']))
  })

  it('adds no confetti dependency (keeps the bundle small)', () => {
    const pkg = JSON.parse(read('package.json'))
    expect({ ...pkg.dependencies, ...pkg.devDependencies }).not.toHaveProperty('canvas-confetti')
    expect(read('lib/growth/confetti.ts').length).toBeLessThan(6000)
  })
})
