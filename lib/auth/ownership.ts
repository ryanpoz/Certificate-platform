import { getCurrentUser } from '@/lib/utils/session'

/**
 * Account ownership checks for server actions.
 *
 * Every server action is callable from the browser with any arguments, so an
 * ID or academyId passed in must never be trusted. Resolve the signed-in
 * account and scope every read and write to it.
 */

export interface SessionAccount {
  userId: string
  academyId: string
}

/** Generic message so callers can't probe which IDs exist in other accounts */
export const NOT_FOUND = 'Not found'

export function isSameAccount(sessionAcademyId: string | null | undefined, requestedAcademyId: string | null | undefined): boolean {
  return !!sessionAcademyId && !!requestedAcademyId && sessionAcademyId === requestedAcademyId
}

/** The signed-in account, or null */
export async function getSessionAccount(): Promise<SessionAccount | null> {
  const user = await getCurrentUser()
  return user ? { userId: user.id, academyId: user.academyId } : null
}

/**
 * The signed-in account if it owns `academyId` (or if no academyId is given), else null.
 */
export async function accountFor(academyId?: string | null): Promise<SessionAccount | null> {
  const account = await getSessionAccount()
  if (!account) return null
  if (academyId !== undefined && academyId !== null && !isSameAccount(account.academyId, academyId)) return null
  return account
}

/** Like accountFor, but throws (for actions whose callers expect a throw on failure) */
export async function requireAccountFor(academyId?: string | null): Promise<SessionAccount> {
  const account = await accountFor(academyId)
  if (!account) throw new Error(NOT_FOUND)
  return account
}
