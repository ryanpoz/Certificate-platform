import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { certificates, events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isbot } from 'isbot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { certificateNumber, type, referrer } = body

    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.number, certificateNumber))
      .limit(1)

    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (cert.isPreview) {
      return NextResponse.json({ success: true, preview: true })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const isBotRequest = isbot(userAgent)

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    const visitorHash = await hashString(ip + userAgent)

    await db.insert(events).values({
      certificateId: cert.id,
      academyId: cert.academyId,
      type,
      at: new Date(),
      referrer: referrer || null,
      userAgent,
      isBot: isBotRequest,
      visitorHash,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Event tracking error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
