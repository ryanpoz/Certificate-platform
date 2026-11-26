/**
 * Expiry reminders and the expiring-soon view: pure date and scheduling rules
 * (no database access).
 *
 * Reminders go out 30 and 7 days before a certificate expires. Each one is
 * sent at most once per certificate and expiry date (see the reminder log in
 * sql/007). If the cron misses a day, or a certificate is issued close to its
 * expiry, only the most urgent reminder that is due is sent; earlier ones are
 * never sent late.
 */

/** Days before expiry that a reminder is sent, most distant first */
export const REMINDER_DAYS = [30, 7] as const
export type ReminderDays = (typeof REMINDER_DAYS)[number]

/** Windows offered by the expiring-soon view */
export const EXPIRING_WINDOWS = [30, 60, 90] as const
export type ExpiringWindow = (typeof EXPIRING_WINDOWS)[number]
export const DEFAULT_EXPIRING_WINDOW: ExpiringWindow = 30

const DAY_MS = 24 * 60 * 60 * 1000

/** ?window=60 -> 60; anything else -> 30 */
export function parseExpiringWindow(value: string | string[] | null | undefined): ExpiringWindow {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number(raw)
  return (EXPIRING_WINDOWS as readonly number[]).includes(n) ? (n as ExpiringWindow) : DEFAULT_EXPIRING_WINDOW
}

/**
 * Whole days until expiry, rounded up: anything later today or within the
 * next 24 hours is 1 day; 0 or less means it has expired.
 */
export function daysLeft(expiryDate: Date, now: Date = new Date()): number {
  return Math.ceil((expiryDate.getTime() - now.getTime()) / DAY_MS)
}

/** Certificates expiring in (now, now + window days] are "expiring soon" */
export function expiringRange(windowDays: number, now: Date = new Date()): { from: Date; to: Date } {
  return { from: new Date(now.getTime()), to: new Date(now.getTime() + windowDays * DAY_MS) }
}

export function isExpiringWithin(expiryDate: Date | null | undefined, windowDays: number, now: Date = new Date()): boolean {
  if (!expiryDate) return false
  const { from, to } = expiringRange(windowDays, now)
  return expiryDate.getTime() > from.getTime() && expiryDate.getTime() <= to.getTime()
}

/** Only live certificates get reminders or appear in the expiring-soon view */
export interface ReminderCandidate {
  status: string
  revokedAt?: Date | null
  isPreview?: boolean | null
  expiryDate: Date | null
}

export function isLiveCertificate(c: ReminderCandidate): boolean {
  return c.status === 'published' && !c.revokedAt && !c.isPreview
}

/**
 * Which reminder (30 or 7 days before) is due now, or null. `alreadySent` is
 * the list of reminders logged for this certificate's current expiry date.
 */
export function dueReminder(
  c: ReminderCandidate,
  alreadySent: readonly number[],
  now: Date = new Date()
): ReminderDays | null {
  if (!c.expiryDate || !isLiveCertificate(c)) return null
  const left = daysLeft(c.expiryDate, now)
  if (left <= 0) return null
  const due = REMINDER_DAYS.filter((d) => left <= d)
  if (due.length === 0) return null
  const mostUrgent = due[due.length - 1]
  return alreadySent.includes(mostUrgent) ? null : mostUrgent
}

/** The cron looks this far ahead (the earliest reminder) */
export const REMINDER_LOOKAHEAD_DAYS = Math.max(...REMINDER_DAYS)

/** "in 7 days", "tomorrow" */
export function daysLeftPhrase(left: number): string {
  if (left <= 1) return 'tomorrow'
  return `in ${left} days`
}
