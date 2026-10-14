'use server'

import { db } from '@/lib/db'
import { users, academies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createMagicLinkToken } from '@/lib/utils/auth'
import { normalizeEmail } from '@/lib/utils/helpers'

export async function sendMagicLink(email: string) {
  const normalised = normalizeEmail(email)
  
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      academyId: users.academyId,
      academyName: academies.name,
    })
    .from(users)
    .innerJoin(academies, eq(users.academyId, academies.id))
    .where(eq(users.email, normalised))
    .limit(1)

  if (!user) {
    return { error: 'No account found with this email' }
  }

  const token = await createMagicLinkToken(user.id, user.email)
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 15)

  await db
    .update(users)
    .set({
      magicLinkToken: token,
      magicLinkExpiry: expiry,
    })
    .where(eq(users.id, user.id))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLink = `${appUrl}/auth/verify?token=${token}`

  console.log('Magic link for', email, ':', magicLink)

  return { success: true, message: 'Magic link sent! Check console for link (email stubbed in Sprint 1).' }
}
