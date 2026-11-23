import { db } from '@/lib/db'
import { learners } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

/** Same rule as normalizeEmail in lib/utils/helpers (kept here to avoid its nanoid import) */
export function normalizeLearnerEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Learners belong to one account (academy). Every lookup by email MUST be scoped
 * to the issuing account so one account's recipient is never matched to another's.
 */
export function learnerByEmailQuery(academyId: string, email: string) {
  return db
    .select()
    .from(learners)
    .where(and(eq(learners.academyId, academyId), eq(learners.emailNormalised, normalizeLearnerEmail(email))))
    .limit(1)
}

export async function findOrCreateLearner(academyId: string, fullName: string, email: string) {
  const [existing] = await learnerByEmailQuery(academyId, email)
  if (existing) return existing

  const [created] = await db
    .insert(learners)
    .values({
      academyId,
      fullName,
      email,
      emailNormalised: normalizeLearnerEmail(email),
    })
    .returning()
  return created
}
