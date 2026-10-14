'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { createSessionToken } from '@/lib/utils/auth'

export async function verifyMagicLinkAndLogin(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.magicLinkToken, token),
          gt(users.magicLinkExpiry, new Date())
        )
      )
      .limit(1)

    if (!user) {
      return { success: false, error: 'expired' }
    }

    // Clear the magic link token
    await db
      .update(users)
      .set({
        magicLinkToken: null,
        magicLinkExpiry: null,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Create session and set cookie
    const sessionToken = await createSessionToken(user.id, user.academyId)
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true }
  } catch (error) {
    console.error('Magic link verification error:', error)
    return { success: false, error: 'server_error' }
  }
}
