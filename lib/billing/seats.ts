/**
 * Admin seats. Seat limits come from the plan (Business: contract value, floor 5).
 * When an account has more admins than seats, the longest-standing admins keep
 * full access and the rest become view-only. Nobody is removed, and access comes
 * back as soon as the limit rises.
 */
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { accountLimit } from './usage'
import { seatAccess, type SeatAccess } from './downgrade'

/** Users on the account, oldest first (seat order) */
export async function accountUserIdsOldestFirst(academyId: string): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.academyId, academyId))
    .orderBy(asc(users.createdAt), asc(users.id))
  return rows.map((r) => r.id)
}

/**
 * Seat access for a signed-in user: admin, or view-only when the account has
 * more admins than its plan's seats (extra admins are never removed).
 * Defaults to admin if seats can't be read.
 */
export async function getSeatAccess(userId: string, academyId: string): Promise<SeatAccess> {
  try {
    const [ids, limit] = await Promise.all([accountUserIdsOldestFirst(academyId), accountLimit(academyId, 'adminSeats')])
    return seatAccess(ids, userId, limit)
  } catch {
    return 'admin'
  }
}
