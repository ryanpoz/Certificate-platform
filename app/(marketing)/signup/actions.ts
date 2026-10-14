'use server'

import { db } from '@/lib/db'
import { academies, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createMagicLinkToken } from '@/lib/utils/auth'
import { sendMagicLink } from '@/lib/email/magic-link'

export async function signupAction(data: {
  name: string
  email: string
  academyName: string
}) {
  const emailNorm = data.email.toLowerCase().trim()
  
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
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
      replyTo: data.email,
      brandColor: '#2563eb',
    })
    .returning()

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      academyId: academy.id,
      name: data.name,
      email: data.email,
    })
    .returning()

  // Send magic link
  const token = await createMagicLinkToken(user.id, data.email)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLink = `${appUrl}/auth/verify?token=${token}`
  
  await sendMagicLink(data.email, magicLink)

  return { success: true, email: data.email }
}
