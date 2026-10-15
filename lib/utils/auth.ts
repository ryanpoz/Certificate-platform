import { SignJWT, jwtVerify } from 'jose'
import { getEnvVar } from './env'

const JWT_SECRET_STRING = getEnvVar('JWT_SECRET', 'dev-secret-key-change-in-production')

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING)

export async function createMagicLinkToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyMagicLinkToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

export async function createSessionToken(userId: string, academyId: string): Promise<string> {
  const token = await new SignJWT({ userId, academyId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
  
  return token
}

export async function verifySessionToken(token: string): Promise<{ userId: string; academyId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      academyId: payload.academyId as string,
    }
  } catch {
    return null
  }
}
