import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { createSessionToken } from '@/lib/utils/auth'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
          <p className="text-gray-600">This magic link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Link Expired</h2>
          <p className="text-gray-600 mb-4">This magic link has expired or has already been used.</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  await db
    .update(users)
    .set({
      magicLinkToken: null,
      magicLinkExpiry: null,
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, user.id))

  const sessionToken = await createSessionToken(user.id, user.academyId)
  const cookieStore = await cookies()
  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect('/dashboard')
}
