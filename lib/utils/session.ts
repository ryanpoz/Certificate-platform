import { cookies } from 'next/headers'
import { verifySessionToken } from './auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value

  if (!sessionToken) {
    return null
  }

  try {
    const session = await verifySessionToken(sessionToken)
    if (!session) {
      // Invalid token - clear cookie
      cookieStore.delete('session')
      return null
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) {
      // User not found (stale session from old DB) - clear cookie
      cookieStore.delete('session')
      return null
    }

    return user
  } catch (error) {
    // Database error or any other issue - clear cookie and return null
    console.error('Session validation error:', error)
    cookieStore.delete('session')
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}
