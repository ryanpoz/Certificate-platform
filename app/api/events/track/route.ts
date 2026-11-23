import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { certificates, events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isbot } from 'isbot'
import { isShareChannel, isTrackableEvent, resolveViewSource } from '@/lib/growth/tracking'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { certificateNumber, type, referrer, isRecipient, channel, utmSource, utmMedium } = body

    // Only lightweight growth-loop events are accepted from the public page
    if (!isTrackableEvent(type) || typeof certificateNumber !== 'string') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }
    if (type === 'share_click' && !isShareChannel(channel)) {
      return NextResponse.json({ error: 'Invalid share channel' }, { status: 400 })
    }

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

    const safeReferrer = typeof referrer === 'string' && referrer ? referrer.slice(0, 500) : null
    const source = type === 'page_view' ? resolveViewSource(utmSource, safeReferrer) : undefined
    const meta = {
      ...(isRecipient ? { isRecipient: true } : {}),
      ...(source ? { source } : {}),
      ...(type === 'share_click' ? { channel } : {}),
    }
    const utmData = typeof utmSource === 'string' && utmSource
      ? {
          utm_source: utmSource.slice(0, 40),
          ...(typeof utmMedium === 'string' && utmMedium ? { utm_medium: utmMedium.slice(0, 40) } : {}),
        }
      : null

    await db.insert(events).values({
      certificateId: cert.id,
      academyId: cert.academyId,
      type,
      at: new Date(),
      referrer: safeReferrer,
      utmData,
      userAgent,
      isBot: isBotRequest,
      visitorHash,
      meta: Object.keys(meta).length > 0 ? meta : null,
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
