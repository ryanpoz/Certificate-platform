import { firstName } from './share'

/**
 * First-view celebration on the recipient's certificate page (pure helpers,
 * safe for client and server so they can be unit tested without a browser).
 *
 * Rules:
 * - Only the recipient celebrates: they arrive from the issue email with
 *   ?recipient=true. Verifiers (QR, shared links, search) never carry it.
 * - Only the first view celebrates. After that the share prompt shows
 *   statically until dismissed, and never replays the animation.
 * - prefers-reduced-motion gets the same content with no motion.
 */

/** Minimal Storage surface so tests can pass a fake */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type CertificateStatus = 'valid' | 'expired' | 'revoked'

/** What the recipient sees above their certificate */
export type ClaimMode = 'celebrate' | 'prompt' | 'none'

export const celebrationKey = (certificateNumber: string) => `certificate-celebrated:${certificateNumber}`
/** Same key the earlier share prompt used, so a past dismissal still holds */
export const promptDismissedKey = (certificateNumber: string) => `claim-prompt-dismissed:${certificateNumber}`
/** Per-tab memory that this visitor arrived as the recipient (survives reloads, not shared links) */
export const recipientSessionKey = (certificateNumber: string) => `certificate-recipient:${certificateNumber}`

export const RECIPIENT_PARAM = 'recipient'

function safeGet(store: KeyValueStore | null | undefined, key: string): string | null {
  if (!store) return null
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

function safeSet(store: KeyValueStore | null | undefined, key: string, value: string) {
  if (!store) return
  try {
    store.setItem(key, value)
  } catch {
    // storage can be full or blocked (private mode); the page still works
  }
}

/**
 * Whether this visitor is the recipient: the email link's ?recipient=true, or a
 * reload in the same tab after we tidied that flag out of the address bar.
 */
export function resolveIsRecipient(input: {
  search: string
  certificateNumber: string
  session?: KeyValueStore | null
}): boolean {
  const params = new URLSearchParams(input.search)
  if (params.get(RECIPIENT_PARAM) === 'true') {
    safeSet(input.session, recipientSessionKey(input.certificateNumber), '1')
    return true
  }
  return safeGet(input.session, recipientSessionKey(input.certificateNumber)) === '1'
}

/**
 * Address-bar URL with the recipient flag removed, so a recipient who copies the
 * URL to share it never hands verifiers a link that would celebrate for them.
 * Returns null when there is nothing to remove.
 */
export function stripRecipientParam(href: string): string | null {
  try {
    const url = new URL(href)
    if (!url.searchParams.has(RECIPIENT_PARAM)) return null
    url.searchParams.delete(RECIPIENT_PARAM)
    return url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash
  } catch {
    return null
  }
}

export function resolveClaimMode(input: {
  isRecipient: boolean
  status: CertificateStatus
  isPreview: boolean
  certificateNumber: string
  storage?: KeyValueStore | null
  /** utm_medium of the visit; reminder emails are not a claim moment */
  medium?: string | null
}): ClaimMode {
  // Verifiers, previews and certificates that are not valid never see it
  if (!input.isRecipient || input.status !== 'valid' || input.isPreview) return 'none'
  if (safeGet(input.storage, promptDismissedKey(input.certificateNumber)) === '1') return 'none'
  if (safeGet(input.storage, celebrationKey(input.certificateNumber)) === '1') return 'prompt'
  // Opening the certificate from an expiry reminder is not the first claim
  if (input.medium === 'expiry_reminder') return 'prompt'
  return 'celebrate'
}

/** Record the first view so the animation never replays on this device */
export function markCelebrated(storage: KeyValueStore | null | undefined, certificateNumber: string) {
  safeSet(storage, celebrationKey(certificateNumber), '1')
}

export function markPromptDismissed(storage: KeyValueStore | null | undefined, certificateNumber: string) {
  safeSet(storage, promptDismissedKey(certificateNumber), '1')
}

/** Minimal matchMedia surface so tests can pass a fake */
export interface MotionQuery {
  matchMedia?: (query: string) => { matches: boolean }
}

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(win: MotionQuery | null | undefined): boolean {
  try {
    return Boolean(win?.matchMedia?.(REDUCED_MOTION_QUERY).matches)
  } catch {
    return false
  }
}

/** Animated reveal with confetti, or the static version for reduced motion */
export function celebrationStyle(mode: ClaimMode, reducedMotion: boolean): 'animated' | 'static' | 'none' {
  if (mode === 'none') return 'none'
  if (mode === 'prompt' || reducedMotion) return 'static'
  return 'animated'
}

export function celebrationCopy(fullName: string, certificateTitle: string) {
  return {
    headline: `Congratulations, ${firstName(fullName)}!`,
    subhead: `You've earned your ${certificateTitle} certificate.`,
  }
}
