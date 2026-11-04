/**
 * Tests for GET /api/keep-alive (Supabase inactivity ping via Vercel Cron)
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest } from 'next/server'

jest.mock('@/lib/db', () => ({
  db: {
    execute: jest.fn(),
  },
}))

import { GET } from '@/app/api/keep-alive/route'
import { db } from '@/lib/db'

describe('GET /api/keep-alive', () => {
  const originalSecret = process.env.CRON_SECRET

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalSecret
    }
    jest.clearAllMocks()
  })

  it('returns 401 when Authorization bearer token is missing', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    const request = new NextRequest('http://localhost/api/keep-alive')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
    expect(db.execute).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization bearer token is wrong', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    const request = new NextRequest('http://localhost/api/keep-alive', {
      headers: { Authorization: 'Bearer wrong-secret' },
    })
    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(db.execute).not.toHaveBeenCalled()
  })

  it('returns 401 when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET
    const request = new NextRequest('http://localhost/api/keep-alive', {
      headers: { Authorization: 'Bearer anything' },
    })
    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(db.execute).not.toHaveBeenCalled()
  })

  it('returns ok and timestamp on success with valid bearer token', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    ;(db.execute as jest.Mock).mockResolvedValueOnce([{ '?column?': 1 }])

    const request = new NextRequest('http://localhost/api/keep-alive', {
      headers: { Authorization: 'Bearer test-cron-secret' },
    })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(db.execute).toHaveBeenCalledTimes(1)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(typeof body.at).toBe('string')
    expect(Number.isNaN(Date.parse(body.at))).toBe(false)
  })

  it('returns 500 with a short message when the database query fails', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    ;(db.execute as jest.Mock).mockRejectedValueOnce(new Error('connection refused'))

    const request = new NextRequest('http://localhost/api/keep-alive', {
      headers: { Authorization: 'Bearer test-cron-secret' },
    })
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Database keep-alive failed')
    expect(JSON.stringify(body)).not.toMatch(/postgresql:\/\//i)
    expect(JSON.stringify(body)).not.toMatch(/password/i)
  })
})

describe('keep-alive cron wiring', () => {
  it('schedules /api/keep-alive daily in vercel.json', () => {
    const vercelJson = JSON.parse(
      readFileSync(join(process.cwd(), 'vercel.json'), 'utf-8')
    )
    expect(vercelJson.crons).toEqual(
      expect.arrayContaining([
        { path: '/api/keep-alive', schedule: '0 15 * * *' },
      ])
    )
  })

  it('is not blocked by middleware auth', () => {
    const middlewarePath = join(process.cwd(), 'middleware.ts')
    const srcMiddlewarePath = join(process.cwd(), 'src/middleware.ts')
    if (!existsSync(middlewarePath) && !existsSync(srcMiddlewarePath)) {
      // No Next.js middleware — API routes are reachable without session auth
      expect(true).toBe(true)
      return
    }
    const source = readFileSync(
      existsSync(middlewarePath) ? middlewarePath : srcMiddlewarePath,
      'utf-8'
    )
    expect(source).toMatch(/keep-alive|\/api\//)
  })
})
