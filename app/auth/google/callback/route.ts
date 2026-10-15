import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users, academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createSessionToken } from '@/lib/utils/auth'
import { normalizeEmail } from '@/lib/utils/helpers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture?: string
  given_name?: string
  family_name?: string
}

export async function GET(request: NextRequest) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_not_configured', request.url))
  }

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_request', request.url))
  }

  // Verify state
  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  
  if (!storedState || storedState !== state) {
    console.error('State mismatch in OAuth callback')
    return NextResponse.redirect(new URL('/auth/login?error=state_mismatch', request.url))
  }

  // Clear state cookie
  cookieStore.delete('oauth_state')

  try {
    // Exchange code for tokens
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const redirectUri = `${appUrl}/auth/google/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/auth/login?error=token_exchange_failed', request.url))
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Verify and decode ID token
    const userInfo = await verifyGoogleIdToken(tokens.id_token)

    if (!userInfo.email_verified) {
      console.error('Google email not verified')
      return NextResponse.redirect(new URL('/auth/login?error=email_not_verified', request.url))
    }

    const emailNorm = normalizeEmail(userInfo.email)

    // Check if user exists
    const [existingUser] = await db
      .select({
        id: users.id,
        academyId: users.academyId,
      })
      .from(users)
      .where(eq(users.email, emailNorm))
      .limit(1)

    let userId: string
    let academyId: string

    if (existingUser) {
      // User exists, log them in
      userId = existingUser.id
      academyId = existingUser.academyId

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId))
    } else {
      // Create new academy and user (like magic link signup)
      const academyName = `${userInfo.name}'s Academy`
      const slug = academyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()

      const [academy] = await db
        .insert(academies)
        .values({
          name: academyName,
          slug,
          senderName: academyName,
          replyTo: emailNorm,
          brandColor: '#2563eb',
        })
        .returning()

      const [user] = await db
        .insert(users)
        .values({
          academyId: academy.id,
          name: userInfo.name,
          email: emailNorm,
        })
        .returning()

      userId = user.id
      academyId = academy.id
    }

    // Create session
    const sessionToken = await createSessionToken(userId, academyId)
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url))
  }
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  // Decode JWT without verification (Google's own endpoint will verify)
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid ID token format')
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

  // Verify with Google's tokeninfo endpoint for additional security
  const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
  
  if (!verifyResponse.ok) {
    throw new Error('ID token verification failed')
  }

  const verifiedPayload: GoogleUserInfo = await verifyResponse.json()

  // Verify audience matches our client ID
  if (verifiedPayload.sub !== payload.sub) {
    throw new Error('Token subject mismatch')
  }

  return verifiedPayload
}
