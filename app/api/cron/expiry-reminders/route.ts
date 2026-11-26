import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron/auth'
import { runExpiryReminders } from '@/lib/reminders/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Daily expiry reminder run (Vercel Cron). Requires Authorization: Bearer CRON_SECRET. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const summary = await runExpiryReminders()
    return NextResponse.json({ ...summary, at: new Date().toISOString() })
  } catch (error) {
    console.error('Expiry reminder run failed:', error)
    return NextResponse.json({ ok: false, error: 'Expiry reminder run failed' }, { status: 500 })
  }
}
