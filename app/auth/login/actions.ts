'use server'

import { db } from '@/lib/db'
import { users, academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createMagicLinkToken } from '@/lib/utils/auth'
import { normalizeEmail } from '@/lib/utils/helpers'
import { sendMagicLink } from '@/lib/email/magic-link'

export async function sendMagicLinkAction(email: string) {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const magicLink = `${appUrl}/auth/verify?token=${token}`

  await sendMagicLink(normalised, magicLink)

  return { success: true, message: 'Magic link sent! Check your email.' }
}
