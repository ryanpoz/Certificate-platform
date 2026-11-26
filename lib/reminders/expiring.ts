/**
 * The expiring-soon view: live certificates on an account that expire within
 * the chosen window (30, 60 or 90 days). Read-only; needs no new tables.
 */
import { db } from '@/lib/db'
import { certificates, courses, learners } from '@/lib/db/schema'
import { and, asc, eq, gt, isNull, lte, sql } from 'drizzle-orm'
import { daysLeft, expiringRange, type ExpiringWindow } from './schedule'

export const EXPIRING_LIST_LIMIT = 500

export interface ExpiringCertificate {
  id: string
  number: string
  learnerName: string
  learnerEmail: string
  courseId: string
  courseName: string
  expiryDate: Date
  daysLeft: number
}

/** Filter shared by the view and the reminder run: live, not revoked, not a preview, expiring in range */
export function liveExpiringWhere(from: Date, to: Date) {
  return and(
    eq(certificates.status, 'published'),
    isNull(certificates.revokedAt),
    sql`coalesce(${certificates.isPreview}, false) = false`,
    gt(certificates.expiryDate, from),
    lte(certificates.expiryDate, to)
  )
}

export async function getExpiringCertificates(
  academyId: string,
  window: ExpiringWindow,
  now: Date = new Date()
): Promise<ExpiringCertificate[]> {
  const { from, to } = expiringRange(window, now)
  const rows = await db
    .select({
      id: certificates.id,
      number: certificates.number,
      learnerName: learners.fullName,
      learnerEmail: learners.email,
      courseId: courses.id,
      courseName: courses.name,
      expiryDate: certificates.expiryDate,
    })
    .from(certificates)
    .innerJoin(learners, eq(certificates.learnerId, learners.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(and(eq(certificates.academyId, academyId), liveExpiringWhere(from, to)))
    .orderBy(asc(certificates.expiryDate))
    .limit(EXPIRING_LIST_LIMIT)
  return rows
    .filter((r): r is typeof r & { expiryDate: Date } => r.expiryDate instanceof Date)
    .map((r) => ({ ...r, daysLeft: daysLeft(r.expiryDate, now) }))
}
