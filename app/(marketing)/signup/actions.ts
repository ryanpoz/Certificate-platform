'use server'

import { db } from '@/lib/db'
import { academies, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createMagicLinkToken } from '@/lib/utils/auth'
import { sendMagicLink } from '@/lib/email/magic-link'
import { normalizeEmail } from '@/lib/utils/helpers'

export async function signupAction(data: {
  name: string
  email: string
  academyName: string
}) {
  const emailNorm = normalizeEmail(data.email)
  
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, emailNorm))
    .limit(1)

  if (existingUser.length > 0) {
    return { error: 'An account with this email already exists. Please log in instead.' }
  }

  // Generate slug from academy name
  const slug = data.academyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()

  // Create academy
  const [academy] = await db
    .insert(academies)
    .values({
      name: data.academyName,
      slug,
      senderName: data.academyName,
      replyTo: emailNorm,
      brandColor: '#2563eb',
    })
    .returning()

  // Create magic link token
  const token = await createMagicLinkToken('temp', emailNorm)
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 15)

  // Create user with magic link token
  const [user] = await db
    .insert(users)
    .values({
      academyId: academy.id,
      name: data.name,
      email: emailNorm,
      magicLinkToken: token,
      magicLinkExpiry: expiry,
    })
    .returning()

  // Update token with actual user ID
  const actualToken = await createMagicLinkToken(user.id, emailNorm)
  await db
    .update(users)
    .set({ magicLinkToken: actualToken })
    .where(eq(users.id, user.id))

  // Send magic link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const magicLink = `${appUrl}/auth/verify?token=${actualToken}`
  
  await sendMagicLink(emailNorm, magicLink)

  return { success: true, email: emailNorm }
}
