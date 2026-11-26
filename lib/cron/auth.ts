import { timingSafeEqual } from 'crypto'

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Refuse everything
 * when CRON_SECRET is not set.
 */
export function isAuthorizedCron(authorization: string | null, secret: string | undefined = process.env.CRON_SECRET): boolean {
  if (!secret || !authorization) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(authorization)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
