/**
 * Expiry reminders on/off per certificate design (program). No saved row means
 * on. Settings are kept when a plan loses reminders, so they come back on
 * upgrade. Falls back to the default (on) if sql/007 isn't run yet; reminders
 * still can't send without the sql/007 log, so nothing goes out early.
 */
import { db } from '@/lib/db'
import { courseReminderSettings } from '@/lib/db/schema'
import { and, eq, inArray } from 'drizzle-orm'

export const REMINDERS_DEFAULT_ON = true
export const REMINDERS_NOT_MIGRATED = 'Reminder settings are not set up yet: run sql/007-expiry-reminders.sql.'

/** Saved on/off values for the account's programs (empty if none or not migrated) */
export async function getReminderSettings(academyId: string, courseIds?: string[]): Promise<Map<string, boolean>> {
  if (courseIds && courseIds.length === 0) return new Map()
  try {
    const rows = await db
      .select({ courseId: courseReminderSettings.courseId, enabled: courseReminderSettings.enabled })
      .from(courseReminderSettings)
      .where(
        courseIds
          ? and(eq(courseReminderSettings.academyId, academyId), inArray(courseReminderSettings.courseId, courseIds))
          : eq(courseReminderSettings.academyId, academyId)
      )
    return new Map(rows.map((r) => [r.courseId, r.enabled]))
  } catch {
    return new Map()
  }
}

export function remindersEnabledFor(settings: Map<string, boolean>, courseId: string): boolean {
  return settings.get(courseId) ?? REMINDERS_DEFAULT_ON
}

/** Save the on/off value for one program (callers check ownership and plan first) */
export async function saveCourseReminders(academyId: string, courseId: string, enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    await db
      .insert(courseReminderSettings)
      .values({ courseId, academyId, enabled, updatedAt: new Date() })
      .onConflictDoUpdate({ target: courseReminderSettings.courseId, set: { enabled, updatedAt: new Date() } })
    return { ok: true }
  } catch {
    return { ok: false, error: REMINDERS_NOT_MIGRATED }
  }
}
