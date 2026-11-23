import { db } from '@/lib/db'
import { certificates, events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SIGNUP_ATTRIBUTED_EVENT, normalizeRef } from './tracking'

/**
 * Record that a new account signed up after following a certificate link.
 * Stored against the referring certificate (internal metric, not shown to issuers yet).
 * Never throws: attribution must not break signup.
 */
export async function recordAttributedSignup(ref: unknown, newAcademyId: string, method: 'email' | 'google'): Promise<boolean> {
  const certificateNumber = normalizeRef(ref)
  if (!certificateNumber) return false
  try {
    const [cert] = await db
      .select({ id: certificates.id, academyId: certificates.academyId })
      .from(certificates)
      .where(eq(certificates.number, certificateNumber))
      .limit(1)
    if (!cert || cert.academyId === newAcademyId) return false

    await db.insert(events).values({
      certificateId: cert.id,
      academyId: cert.academyId,
      type: SIGNUP_ATTRIBUTED_EVENT,
      at: new Date(),
      meta: { newAcademyId, method },
    })
    return true
  } catch (error) {
    console.error('Failed to record attributed signup:', error)
    return false
  }
}
