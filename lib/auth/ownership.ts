import { getCurrentUser } from '@/lib/utils/session'
import { getSeatAccess } from '@/lib/billing/seats'

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

/** Shown to admins whose seat is view-only because the plan has fewer admin seats */
export const VIEW_ONLY = 'Your seat is view-only on this plan. Ask an account admin to upgrade for more admin seats.'

export interface AccessOptions {
  /** Read-only use (viewing, exporting): allowed for view-only seats */
  read?: boolean
}

/** Is this signed-in user on a view-only seat? (extra admins after a downgrade) */
export async function isViewOnly(userId: string, academyId: string): Promise<boolean> {
  return (await getSeatAccess(userId, academyId)) === 'view_only'
}

/**
 * The signed-in account if it owns `academyId` (or if no academyId is given), else null.
 * Writes (the default) also need an admin seat; pass { read: true } for read-only use.
 */
export async function accountFor(academyId?: string | null, options: AccessOptions = {}): Promise<SessionAccount | null> {
  const account = await getSessionAccount()
  if (!account) return null
  if (academyId !== undefined && academyId !== null && !isSameAccount(account.academyId, academyId)) return null
  if (!options.read && (await isViewOnly(account.userId, account.academyId))) return null
  return account
}

/** The signed-in account for a write, or null (signed out or view-only seat) */
export async function getWritableAccount(): Promise<SessionAccount | null> {
  return accountFor(undefined)
}

/** Like accountFor, but throws (for actions whose callers expect a throw on failure) */
export async function requireAccountFor(academyId?: string | null, options: AccessOptions = {}): Promise<SessionAccount> {
  const account = await getSessionAccount()
  if (!account) throw new Error(NOT_FOUND)
  if (academyId !== undefined && academyId !== null && !isSameAccount(account.academyId, academyId)) throw new Error(NOT_FOUND)
  if (!options.read && (await isViewOnly(account.userId, account.academyId))) throw new Error(VIEW_ONLY)
  return account
}
