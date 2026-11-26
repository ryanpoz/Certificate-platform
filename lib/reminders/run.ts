/**
 * Daily expiry reminder run (called by the Vercel cron route).
 *
 * For every live certificate expiring in the next 30 days:
 * - the account's plan must include `expiryReminders` (Growth and up);
 *   when a plan loses it, reminders simply stop (settings are kept);
 * - reminders must be on for its program (default on);
 * - the reminder that is due (30 or 7 days before) is claimed in the reminder
 *   log first (unique per certificate, reminder and expiry date), and only the
 *   run that claims it sends it, so a reminder never goes out twice.
 * Without the sql/007 log table nothing is sent.
 */
import { db } from '@/lib/db'
import { academies, certificates, courses, expiryReminders, learners } from '@/lib/db/schema'
import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import { BRAND } from '@/lib/config/brand'
import { can } from '@/lib/billing/entitlements'
import { getAccountForEntitlements } from '@/lib/billing/usage'
import { emailBrandingFor, type EmailBranding } from '@/lib/email/branding'
import { expiryReminderContent, type ExpiryReminderContent } from '@/lib/email/expiry-reminder'
import { sendExpiryReminderEmail } from '@/lib/email/resend'
import { daysLeft, dueReminder, expiringRange, REMINDER_LOOKAHEAD_DAYS } from './schedule'
import { liveExpiringWhere } from './expiring'
import { getReminderSettings, remindersEnabledFor } from './settings'

/** Failed sends are retried on later runs, up to this many attempts in total */
export const MAX_REMINDER_ATTEMPTS = 3
/** Certificates handled per run (the rest are picked up the next day) */
export const REMINDER_BATCH_LIMIT = 1000

export type SendReminder = (params: { to: string; content: ExpiryReminderContent }) => Promise<{ success: boolean; messageId?: string; error?: string }>

export interface ReminderRunSummary {
  ok: boolean
  /** Set when the run couldn't start (e.g. sql/007 not run) */
  reason?: string
  checked: number
  sent: number
  failed: number
  notDue: number
  skippedPlan: number
  skippedDisabled: number
  duplicates: number
}

interface LogRow {
  certificateId: string
  daysBefore: number
  expiryDate: Date
  status: string
  attempts: number
}

/** Reminders already handled for this certificate's current expiry date (sent, in progress, or out of retries) */
export function handledReminderDays(rows: LogRow[], certificateId: string, expiryDate: Date): number[] {
  return rows
    .filter(
      (r) =>
        r.certificateId === certificateId &&
        r.expiryDate.getTime() === expiryDate.getTime() &&
        (r.status !== 'failed' || r.attempts >= MAX_REMINDER_ATTEMPTS)
    )
    .map((r) => r.daysBefore)
}

/**
 * Claim one reminder in the log. Returns true only for the caller that wins:
 * a new row, or a failed row with retries left. Anything else (already sent,
 * being sent by another run) returns false.
 */
async function claimReminder(c: { id: string; academyId: string; expiryDate: Date }, days: number, previous: LogRow | undefined): Promise<boolean> {
  if (previous) {
    if (previous.status !== 'failed' || previous.attempts >= MAX_REMINDER_ATTEMPTS) return false
    const claimed = await db
      .update(expiryReminders)
      .set({ status: 'sending', attempts: sql`${expiryReminders.attempts} + 1`, error: null })
      .where(
        and(
          eq(expiryReminders.certificateId, c.id),
          eq(expiryReminders.daysBefore, days),
          eq(expiryReminders.expiryDate, c.expiryDate),
          eq(expiryReminders.status, 'failed'),
          lt(expiryReminders.attempts, MAX_REMINDER_ATTEMPTS)
        )
      )
      .returning({ id: expiryReminders.id })
    return claimed.length > 0
  }
  const inserted = await db
    .insert(expiryReminders)
    .values({ certificateId: c.id, academyId: c.academyId, daysBefore: days, expiryDate: c.expiryDate, status: 'sending' })
    .onConflictDoNothing()
    .returning({ id: expiryReminders.id })
  return inserted.length > 0
}

export async function runExpiryReminders(options: { now?: Date; send?: SendReminder } = {}): Promise<ReminderRunSummary> {
  const now = options.now ?? new Date()
  const send = options.send ?? sendExpiryReminderEmail
  const summary: ReminderRunSummary = { ok: true, checked: 0, sent: 0, failed: 0, notDue: 0, skippedPlan: 0, skippedDisabled: 0, duplicates: 0 }
  const { from, to } = expiringRange(REMINDER_LOOKAHEAD_DAYS, now)

  const candidates = await db
    .select({
      id: certificates.id,
      number: certificates.number,
      academyId: certificates.academyId,
      courseId: certificates.courseId,
      status: certificates.status,
      revokedAt: certificates.revokedAt,
      isPreview: certificates.isPreview,
      expiryDate: certificates.expiryDate,
      learnerName: learners.fullName,
      learnerEmail: learners.email,
      courseName: courses.name,
      academyName: academies.name,
      senderName: academies.senderName,
      replyTo: academies.replyTo,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(academies, eq(certificates.academyId, academies.id))
    .where(liveExpiringWhere(from, to))
    .limit(REMINDER_BATCH_LIMIT)
  summary.checked = candidates.length
  if (candidates.length === 0) return summary

  // The log is the duplicate guard: without it (sql/007 not run) send nothing
  let log: LogRow[]
  try {
    log = await db
      .select({
        certificateId: expiryReminders.certificateId,
        daysBefore: expiryReminders.daysBefore,
        expiryDate: expiryReminders.expiryDate,
        status: expiryReminders.status,
        attempts: expiryReminders.attempts,
      })
      .from(expiryReminders)
      .where(inArray(expiryReminders.certificateId, candidates.map((c) => c.id)))
  } catch {
    return { ...summary, ok: false, reason: 'Reminder log not set up yet (run sql/007-expiry-reminders.sql). Nothing was sent.' }
  }

  const accounts = new Map<string, { allowed: boolean; branding: EmailBranding; settings: Map<string, boolean> }>()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || BRAND.url).replace(/\/+$/, '')

  for (const c of candidates) {
    if (!c.expiryDate) continue
    let account = accounts.get(c.academyId)
    if (!account) {
      const entitlements = await getAccountForEntitlements(c.academyId)
      const allowed = can(entitlements, 'expiryReminders')
      account = {
        allowed,
        branding: emailBrandingFor(entitlements),
        settings: allowed ? await getReminderSettings(c.academyId) : new Map(),
      }
      accounts.set(c.academyId, account)
    }
    if (!account.allowed) {
      summary.skippedPlan++
      continue
    }
    if (!remindersEnabledFor(account.settings, c.courseId)) {
      summary.skippedDisabled++
      continue
    }

    const expiryDate = c.expiryDate
    const days = dueReminder({ ...c, expiryDate }, handledReminderDays(log, c.id, expiryDate), now)
    if (days === null) {
      summary.notDue++
      continue
    }

    const previous = log.find((r) => r.certificateId === c.id && r.daysBefore === days && r.expiryDate.getTime() === expiryDate.getTime())
    let claimed = false
    try {
      claimed = await claimReminder({ id: c.id, academyId: c.academyId, expiryDate }, days, previous)
    } catch {
      claimed = false
    }
    if (!claimed) {
      summary.duplicates++
      continue
    }

    const content = expiryReminderContent({
      learnerName: c.learnerName,
      courseName: c.courseName,
      academyName: c.academyName,
      academySenderName: c.senderName,
      academyReplyTo: c.replyTo,
      certificateNumber: c.number,
      certificateUrl: `${appUrl}/c/${c.number}`,
      expiryDate,
      daysLeft: daysLeft(expiryDate, now),
      branding: account.branding,
    })
    let result: { success: boolean; messageId?: string; error?: string }
    try {
      result = await send({ to: c.learnerEmail, content })
    } catch (error) {
      result = { success: false, error: String(error) }
    }
    const where = and(
      eq(expiryReminders.certificateId, c.id),
      eq(expiryReminders.daysBefore, days),
      eq(expiryReminders.expiryDate, expiryDate)
    )
    try {
      await db
        .update(expiryReminders)
        .set(
          result.success
            ? { status: 'sent', sentAt: new Date(), messageId: result.messageId ?? null }
            : { status: 'failed', error: (result.error ?? 'unknown error').slice(0, 500) }
        )
        .where(where)
    } catch {
      // The row stays 'sending', which is never retried: no duplicate
    }
    if (result.success) summary.sent++
    else summary.failed++
  }
  return summary
}
