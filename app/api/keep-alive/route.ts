import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({
      ok: true,
      at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Keep-alive database check failed:', error)
    return NextResponse.json(
      { error: 'Database keep-alive failed' },
      { status: 500 }
    )
  }
}
