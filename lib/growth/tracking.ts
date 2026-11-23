/**
 * Growth-loop tracking: tags on outbound certificate links and lightweight event rules.
 * Pure helpers, safe for client and server.
 */

/** Where a visit to a certificate page came from */
export const VIEW_SOURCES = [
  'email',
  'linkedin',
  'linkedin_post',
  'x',
  'facebook',
  'qr',
  'pdf',
  'copy',
  'direct',
  'other',
] as const
export type ViewSource = (typeof VIEW_SOURCES)[number]

export const SHARE_CHANNELS = ['linkedin_post', 'x', 'facebook', 'email', 'copy_link', 'copy_text'] as const
export type ShareChannelId = (typeof SHARE_CHANNELS)[number]

/** Event types the public tracking endpoint accepts */
export const TRACKABLE_EVENTS = [
  'page_view',
  'share_click',
  'linkedin_add_click',
  'verified_by_click',
  'pdf_download',
  'cta_click',
] as const
export type TrackableEvent = (typeof TRACKABLE_EVENTS)[number]

/**
 * Which call to action a cta_click came from: the issuer's own button (Growth+)
 * or our default "Create your first certificate" button shown on lower plans.
 */
export const CTA_SOURCES = ['issuer', 'platform'] as const
export type CtaSource = (typeof CTA_SOURCES)[number]

export function isCtaSource(value: unknown): value is CtaSource {
  return typeof value === 'string' && (CTA_SOURCES as readonly string[]).includes(value)
}

/** Issuer CTA click? (older events have no source and were always the issuer's button) */
export function isIssuerCtaClick(meta: unknown): boolean {
  const cta = meta && typeof meta === 'object' ? (meta as Record<string, unknown>).cta : undefined
  return cta !== 'platform'
}

export const SIGNUP_ATTRIBUTED_EVENT = 'signup_attributed'
export const REF_COOKIE = 'cert_ref'
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const UTM_MEDIUM = 'certificate'

export function isTrackableEvent(value: unknown): value is TrackableEvent {
  return typeof value === 'string' && (TRACKABLE_EVENTS as readonly string[]).includes(value)
}

export function isShareChannel(value: unknown): value is ShareChannelId {
  return typeof value === 'string' && (SHARE_CHANNELS as readonly string[]).includes(value)
}

function isViewSource(value: unknown): value is ViewSource {
  return typeof value === 'string' && (VIEW_SOURCES as readonly string[]).includes(value)
}

/** Add utm_source/utm_medium to a certificate link, keeping any existing params */
export function tagCertificateUrl(url: string, source: ViewSource, medium: string = UTM_MEDIUM): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', source)
    u.searchParams.set('utm_medium', medium)
    return u.toString()
  } catch {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}`
  }
}

/** Signup link carrying the referring certificate */
export function signupRefUrl(base: string, certificateNumber: string, source: string = 'certificate'): string {
  const params = new URLSearchParams({
    ref: certificateNumber,
    utm_source: source,
    utm_medium: 'verified_by',
  })
  return `${base.replace(/\/$/, '')}/signup?${params.toString()}`
}

/** Certificate numbers are short uppercase codes with dashes */
export function normalizeRef(ref: unknown): string | null {
  if (typeof ref !== 'string') return null
  const trimmed = ref.trim().toUpperCase()
  return /^[A-Z0-9][A-Z0-9-]{4,39}$/.test(trimmed) ? trimmed : null
}

/** Work out a page view's source from its utm tag, falling back to the referrer */
export function resolveViewSource(utmSource: unknown, referrer: unknown): ViewSource {
  if (isViewSource(utmSource)) return utmSource
  const ref = typeof referrer === 'string' ? referrer.toLowerCase() : ''
  if (!ref) return 'direct'
  if (ref.includes('linkedin.com') || ref.includes('lnkd.in')) return 'linkedin'
  if (ref.includes('t.co/') || ref.includes('twitter.com') || ref.includes('x.com')) return 'x'
  if (ref.includes('facebook.com') || ref.includes('fb.me')) return 'facebook'
  if (ref.includes('mail.') || ref.includes('outlook.') || ref.includes('gmail')) return 'email'
  return 'other'
}

export const SOURCE_LABELS: Record<ViewSource, string> = {
  email: 'Email',
  linkedin: 'LinkedIn profile',
  linkedin_post: 'LinkedIn post',
  x: 'X',
  facebook: 'Facebook',
  qr: 'QR code',
  pdf: 'PDF',
  copy: 'Copied link',
  direct: 'Direct',
  other: 'Other',
}

export const CHANNEL_LABELS: Record<ShareChannelId, string> = {
  linkedin_post: 'LinkedIn post',
  x: 'X',
  facebook: 'Facebook',
  email: 'Email',
  copy_link: 'Copied link',
  copy_text: 'Copied post',
}

export interface LoopEventRow {
  type: string
  key: string | null
  count: number
}

export interface LoopSummary {
  totalViews: number
  viewsBySource: Array<{ source: ViewSource; label: string; count: number }>
  totalShares: number
  sharesByChannel: Array<{ channel: ShareChannelId; label: string; count: number }>
  linkedinAdds: number
  verifiedByClicks: number
}

/** Roll grouped event counts up into the growth-loop summary shown to issuers */
export function summarizeLoopEvents(rows: LoopEventRow[]): LoopSummary {
  const views = new Map<ViewSource, number>()
  const shares = new Map<ShareChannelId, number>()
  let linkedinAdds = 0
  let verifiedByClicks = 0

  for (const row of rows) {
    const count = Number(row.count) || 0
    if (row.type === 'page_view') {
      const source = isViewSource(row.key) ? row.key : 'other'
      views.set(source, (views.get(source) || 0) + count)
    } else if (row.type === 'share_click' && isShareChannel(row.key)) {
      shares.set(row.key, (shares.get(row.key) || 0) + count)
    } else if (row.type === 'linkedin_add_click') {
      linkedinAdds += count
    } else if (row.type === 'verified_by_click') {
      verifiedByClicks += count
    }
  }

  const viewsBySource = VIEW_SOURCES
    .filter((s) => views.has(s))
    .map((source) => ({ source, label: SOURCE_LABELS[source], count: views.get(source)! }))
    .sort((a, b) => b.count - a.count)
  const sharesByChannel = SHARE_CHANNELS
    .filter((c) => shares.has(c))
    .map((channel) => ({ channel, label: CHANNEL_LABELS[channel], count: shares.get(channel)! }))
    .sort((a, b) => b.count - a.count)

  return {
    totalViews: viewsBySource.reduce((n, v) => n + v.count, 0),
    viewsBySource,
    totalShares: sharesByChannel.reduce((n, v) => n + v.count, 0),
    sharesByChannel,
    linkedinAdds,
    verifiedByClicks,
  }
}
