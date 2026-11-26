/**
 * Expiry reminder emails and the expiring-soon view (Growth and up):
 * gating, the window query, reminder scheduling, duplicate prevention, cron
 * auth and the email copy. No real email is sent: the Resend module is mocked.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { getTableName, is, Table } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { NextRequest } from 'next/server'

const ACCOUNT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const OTHER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const USER = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const COURSE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const CERT = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

type Call = { op: string; table: string; fields: string[]; where: any[]; values?: any; set?: any; returning: boolean }
const mockDb: { calls: Call[]; rows: (call: Call) => any[] } = { calls: [], rows: () => [] }
const dialect = new PgDialect()
const params = (c: Call) => c.where.flatMap((w) => dialect.sqlToQuery(w).params)
const sqlOf = (c: Call) => c.where.map((w) => dialect.sqlToQuery(w).sql).join(' ')

function mockChain(call: Call): any {
  const chain: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: any, reject: any) => {
            try {
              return Promise.resolve(mockDb.rows(call)).then(resolve, reject)
            } catch (e) {
              return Promise.reject(e).then(resolve, reject)
            }
          }
        }
        if (prop === 'from') return (t: any) => ((call.table = is(t, Table) ? getTableName(t) : ''), chain)
        if (prop === 'where') return (w: any) => (call.where.push(w), chain)
        if (prop === 'values') return (v: any) => ((call.values = v), chain)
        if (prop === 'set') return (v: any) => ((call.set = v), chain)
        if (prop === 'returning') return () => ((call.returning = true), chain)
        return () => chain
      },
    }
  )
  return chain
}

jest.mock('@/lib/db', () => {
  const { getTableName: name, is: isA, Table: T } = jest.requireActual('drizzle-orm')
  const start = (op: string) => (arg?: any) => {
    const call: Call = { op, table: '', fields: [], where: [], returning: false }
    if (op === 'select' && arg) call.fields = Object.keys(arg)
    if (op !== 'select' && arg && isA(arg, T)) call.table = name(arg)
    mockDb.calls.push(call)
    return mockChain(call)
  }
  return { db: { select: start('select'), update: start('update'), insert: start('insert'), delete: start('delete') } }
})

const mockSession: { user: any } = { user: null }
jest.mock('@/lib/utils/session', () => ({
  getCurrentUser: jest.fn(async () => mockSession.user),
  requireAuth: jest.fn(async () => mockSession.user),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('nanoid', () => ({ nanoid: () => 'ABCDEFGH', customAlphabet: () => () => 'ABCD' }))
// Never send real email from tests
jest.mock('@/lib/email/resend', () => ({
  sendExpiryReminderEmail: jest.fn(async () => ({ success: true, messageId: 'mocked' })),
  sendCertificateEmail: jest.fn(async () => ({ success: true, messageId: 'mocked' })),
}))

import { FEATURES, can } from '@/lib/billing/entitlements'
import {
  REMINDER_DAYS,
  EXPIRING_WINDOWS,
  daysLeft,
  dueReminder,
  expiringRange,
  isExpiringWithin,
  parseExpiringWindow,
} from '@/lib/reminders/schedule'
import { getExpiringCertificates } from '@/lib/reminders/expiring'
import { handledReminderDays, runExpiryReminders, MAX_REMINDER_ATTEMPTS } from '@/lib/reminders/run'
import { getReminderSettings, remindersEnabledFor, REMINDERS_NOT_MIGRATED } from '@/lib/reminders/settings'
import { expiryReminderContent } from '@/lib/email/expiry-reminder'
import { isAuthorizedCron } from '@/lib/cron/auth'
import { sendExpiryReminderEmail } from '@/lib/email/resend'
import { setCourseReminders } from '@/app/dashboard/courses/actions'
import { GET as cronGET } from '@/app/api/cron/expiry-reminders/route'
import { BRAND } from '@/lib/config/brand'

const root = join(__dirname, '..')
const src = (p: string) => readFileSync(join(root, p), 'utf8')
const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-06-10T16:00:00Z')
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY)
const live = (expiryDate: Date | null) => ({ status: 'published', revokedAt: null, isPreview: false, expiryDate })

beforeEach(() => {
  mockDb.calls = []
  mockDb.rows = () => []
  mockSession.user = null
  ;(sendExpiryReminderEmail as jest.Mock).mockClear()
})

// ---------------------------------------------------------------------------
describe('gating', () => {
  it('reminders and the expiring-soon view are live Growth+ features', () => {
    for (const f of ['expiryReminders', 'expiringSoonView'] as const) {
      expect(FEATURES[f]).toMatchObject({ minPlan: 'growth', status: 'live', enforced: true })
      expect(can('free', f)).toBe(false)
      expect(can('starter', f)).toBe(false)
      expect(can('growth', f)).toBe(true)
      expect(can('business', f)).toBe(true)
    }
  })

  it('expiry dates stay Starter and up', () => {
    expect(FEATURES.expiry.minPlan).toBe('starter')
    expect(can('free', 'expiry')).toBe(false)
    expect(can('starter', 'expiry')).toBe(true)
  })

  it('the expiring-soon page checks the plan on the server before loading anything', () => {
    const page = src('app/dashboard/expiring/page.tsx')
    const check = page.indexOf("accountCan(user.academyId, 'expiringSoonView')")
    expect(check).toBeGreaterThan(-1)
    expect(page.indexOf('getExpiringCertificates(user.academyId')).toBeGreaterThan(check)
    expect(page).toMatch(/<LockedFeatureCard[\s\S]*feature="expiringSoonView"[\s\S]*withTrial/)
  })

  it('locked prompts offer "Upgrade now" and "Start 14-day trial" (pricing page, trial Coming soon)', () => {
    const locked = src('components/dashboard/locked-feature.tsx')
    const buttons = locked.slice(locked.indexOf('export function UpgradeButtons'), locked.indexOf('export function PlanBadgeLink'))
    expect(buttons).toContain('Upgrade now')
    expect(buttons).toContain('Start 14-day trial')
    expect(buttons).toContain('Coming soon')
    expect(buttons.match(/href=\{UPGRADE_URL\}/g)).toHaveLength(2)
    expect(buttons).not.toMatch(/checkout|stripe/i)
    const course = src('app/dashboard/courses/[id]/page.tsx')
    expect(course).toMatch(/canUseReminders = can\(plan, 'expiryReminders'\)/)
    expect(course).toMatch(/<UpgradeButtons/)
  })

  it('the pricing page lists reminders as available on Growth (not Coming soon)', () => {
    expect(src('app/(marketing)/pricing/page.tsx')).toContain("{ text: 'Expiry reminder emails and an expiring-soon view' },")
  })

  it('the dashboard nav links to the view', () => {
    expect(src('app/dashboard/layout.tsx')).toContain('href="/dashboard/expiring"')
  })
})

// ---------------------------------------------------------------------------
describe('per-program reminder setting', () => {
  const planRows = (plan: string) => (c: Call) => {
    if (c.table === 'courses') return [{ id: COURSE }]
    if (c.table === 'academy_plans') return [{ plan, customLimit: null }]
    if (c.table === 'users') return [{ id: USER }]
    return []
  }

  it('is on by default and when sql/007 is missing', async () => {
    expect(remindersEnabledFor(new Map(), COURSE)).toBe(true)
    expect(remindersEnabledFor(new Map([[COURSE, false]]), COURSE)).toBe(false)
    mockDb.rows = (c) => {
      if (c.table === 'course_reminder_settings') throw new Error('relation does not exist')
      return []
    }
    await expect(getReminderSettings(ACCOUNT, [COURSE])).resolves.toEqual(new Map())
  })

  it('Growth can turn reminders off (saved per program)', async () => {
    mockSession.user = { id: USER, academyId: ACCOUNT }
    mockDb.rows = planRows('growth')
    const r = await setCourseReminders(COURSE, false)
    expect(r).toEqual({ success: true, enabled: false })
    const insert = mockDb.calls.find((c) => c.op === 'insert')!
    expect(insert.table).toBe('course_reminder_settings')
    expect(insert.values).toMatchObject({ courseId: COURSE, academyId: ACCOUNT, enabled: false })
  })

  it('below Growth the change is refused server-side and the saved value is kept', async () => {
    for (const plan of ['free', 'starter']) {
      mockDb.calls = []
      mockSession.user = { id: USER, academyId: ACCOUNT }
      mockDb.rows = planRows(plan)
      const r = await setCourseReminders(COURSE, true)
      expect(r).toMatchObject({ locked: true })
      expect(mockDb.calls.some((c) => c.op === 'insert' || c.op === 'update' || c.op === 'delete')).toBe(false)
    }
  })

  it('refuses another account’s program and signed-out users', async () => {
    expect(await setCourseReminders(COURSE, true)).toEqual({ error: 'Not found' })
    mockSession.user = { id: USER, academyId: ACCOUNT }
    mockDb.rows = (c) => (c.table === 'courses' ? [] : planRows('growth')(c))
    expect(await setCourseReminders(COURSE, true)).toEqual({ error: 'Not found' })
    expect(mockDb.calls.some((c) => c.op === 'insert')).toBe(false)
  })

  it('reports when sql/007 has not been run', async () => {
    mockSession.user = { id: USER, academyId: ACCOUNT }
    mockDb.rows = (c) => {
      if (c.op === 'insert') throw new Error('relation does not exist')
      return planRows('growth')(c)
    }
    expect(await setCourseReminders(COURSE, false)).toEqual({ error: REMINDERS_NOT_MIGRATED })
  })
})

// ---------------------------------------------------------------------------
describe('expiring-soon window', () => {
  it('offers 30, 60 and 90 days, defaulting to 30', () => {
    expect(EXPIRING_WINDOWS).toEqual([30, 60, 90])
    expect(parseExpiringWindow(undefined)).toBe(30)
    expect(parseExpiringWindow('60')).toBe(60)
    expect(parseExpiringWindow(['90', '30'])).toBe(90)
    expect(parseExpiringWindow('45')).toBe(30)
    expect(parseExpiringWindow('abc')).toBe(30)
    expect(parseExpiringWindow('-30')).toBe(30)
  })

  it('covers (now, now + window]', () => {
    const { from, to } = expiringRange(30, NOW)
    expect(from).toEqual(NOW)
    expect(to).toEqual(inDays(30))
    expect(isExpiringWithin(inDays(30), 30, NOW)).toBe(true)
    expect(isExpiringWithin(new Date(inDays(30).getTime() + 1), 30, NOW)).toBe(false)
    expect(isExpiringWithin(new Date(NOW.getTime() + 1), 30, NOW)).toBe(true)
    expect(isExpiringWithin(NOW, 30, NOW)).toBe(false)
    expect(isExpiringWithin(inDays(-1), 30, NOW)).toBe(false)
    expect(isExpiringWithin(inDays(45), 60, NOW)).toBe(true)
    expect(isExpiringWithin(null, 90, NOW)).toBe(false)
  })

  it('counts days left rounding up', () => {
    expect(daysLeft(inDays(30), NOW)).toBe(30)
    expect(daysLeft(new Date(NOW.getTime() + 60 * 60 * 1000), NOW)).toBe(1)
    expect(daysLeft(new Date(inDays(6).getTime() + 1), NOW)).toBe(7)
    expect(daysLeft(NOW, NOW)).toBe(0)
    expect(daysLeft(inDays(-2), NOW)).toBe(-2)
  })

  it('queries only this account’s live certificates in the window, soonest first', async () => {
    mockDb.rows = () => [
      { id: CERT, number: 'N1', learnerName: 'Ada', learnerEmail: 'ada@example.com', courseId: COURSE, courseName: 'First Aid', expiryDate: inDays(12) },
    ]
    const rows = await getExpiringCertificates(ACCOUNT, 60, NOW)
    expect(rows).toEqual([expect.objectContaining({ id: CERT, learnerName: 'Ada', courseName: 'First Aid', daysLeft: 12 })])
    const q = mockDb.calls[0]
    expect(q.table).toBe('certificates')
    expect(q.fields).toEqual(expect.arrayContaining(['learnerName', 'learnerEmail', 'courseName', 'expiryDate']))
    const p = params(q)
    expect(p).toContain(ACCOUNT)
    expect(p).toContain('published')
    expect(p).not.toContain(OTHER)
    const text = sqlOf(q)
    expect(text).toMatch(/"revoked_at" is null/)
    expect(text).toMatch(/is_preview/)
    expect(text).toMatch(/"expiry_date" > \$\d+/)
    expect(text).toMatch(/"expiry_date" <= \$\d+/)
    const dates = p.filter((x: any) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(x))
    expect(dates).toEqual([NOW.toISOString(), inDays(60).toISOString()])
  })
})

// ---------------------------------------------------------------------------
describe('reminder scheduling', () => {
  it('sends 30 and 7 days before expiry', () => {
    expect(REMINDER_DAYS).toEqual([30, 7])
  })

  it.each([
    [45, [], null],
    [31, [], null],
    [30, [], 30],
    [20, [], 30],
    [20, [30], null],
    [8, [30], null],
    [7, [30], 7],
    [3, [30], 7],
    [3, [], 7], // missed the 30-day one: only the most urgent goes out
    [3, [7], null],
    [1, [30, 7], null],
    [0, [], null],
    [-5, [], null],
  ])('%i days left, already sent %j -> %p', (left, sent, expected) => {
    expect(dueReminder(live(inDays(left as number)), sent as number[], NOW)).toBe(expected)
  })

  it('never reminds for revoked, unpublished, preview or no-expiry certificates', () => {
    expect(dueReminder({ ...live(inDays(5)), revokedAt: NOW }, [], NOW)).toBeNull()
    expect(dueReminder({ ...live(inDays(5)), status: 'unpublished' }, [], NOW)).toBeNull()
    expect(dueReminder({ ...live(inDays(5)), isPreview: true }, [], NOW)).toBeNull()
    expect(dueReminder(live(null), [], NOW)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
describe('reminder run', () => {
  const candidate = (over: Partial<any> = {}) => ({
    id: CERT,
    number: 'ABC123',
    academyId: ACCOUNT,
    courseId: COURSE,
    status: 'published',
    revokedAt: null,
    isPreview: false,
    expiryDate: inDays(7),
    learnerName: 'Ada Lovelace',
    learnerEmail: 'ada@example.com',
    courseName: 'First Aid',
    academyName: 'Acme Training',
    senderName: 'Acme Certificates',
    replyTo: 'help@acme.example',
    ...over,
  })

  function world(opts: {
    plan?: string
    candidates?: any[]
    log?: any[] | 'missing'
    settings?: any[]
    claim?: any[]
    retryClaim?: any[]
  }) {
    return (c: Call) => {
      if (c.op === 'select' && c.table === 'certificates') return opts.candidates ?? [candidate()]
      if (c.op === 'select' && c.table === 'expiry_reminders') {
        if (opts.log === 'missing') throw new Error('relation "expiry_reminders" does not exist')
        return opts.log ?? []
      }
      if (c.op === 'select' && c.table === 'academy_plans') return opts.plan ? [{ plan: opts.plan, customLimit: null }] : []
      if (c.op === 'select' && c.table === 'course_reminder_settings') return opts.settings ?? []
      if (c.op === 'insert' && c.table === 'expiry_reminders') return opts.claim ?? [{ id: 'log-1' }]
      if (c.op === 'update' && c.table === 'expiry_reminders' && c.set?.status === 'sending') return opts.retryClaim ?? [{ id: 'log-1' }]
      return []
    }
  }
  const send = () => jest.fn(async () => ({ success: true, messageId: 'msg-1' }))

  it('sends the due reminder once and logs it as sent', async () => {
    mockDb.rows = world({ plan: 'growth' })
    const s = send()
    const summary = await runExpiryReminders({ now: NOW, send: s })
    expect(summary).toMatchObject({ ok: true, checked: 1, sent: 1, failed: 0, duplicates: 0 })
    expect(s).toHaveBeenCalledTimes(1)
    const arg = (s.mock.calls[0] as any)[0]
    expect(arg.to).toBe('ada@example.com')
    expect(arg.content.subject).toBe('Your First Aid certificate expires in 7 days')
    const claim = mockDb.calls.find((c) => c.op === 'insert' && c.table === 'expiry_reminders')!
    expect(claim.values).toMatchObject({ certificateId: CERT, academyId: ACCOUNT, daysBefore: 7, expiryDate: inDays(7), status: 'sending' })
    const done = mockDb.calls.find((c) => c.op === 'update' && c.set?.status === 'sent')!
    expect(done.set.messageId).toBe('msg-1')
    expect(params(done)).toEqual(expect.arrayContaining([CERT, 7]))
  })

  it('claims in the log before sending (the claim comes first)', async () => {
    const order: string[] = []
    const rows = world({ plan: 'growth' })
    mockDb.rows = (c) => {
      if (c.op === 'insert') order.push('claim')
      return rows(c)
    }
    await runExpiryReminders({ now: NOW, send: jest.fn(async () => (order.push('send'), { success: true })) })
    expect(order).toEqual(['claim', 'send'])
  })

  it('does not send when another run already claimed it (unique key conflict)', async () => {
    mockDb.rows = world({ plan: 'growth', claim: [] })
    const s = send()
    const summary = await runExpiryReminders({ now: NOW, send: s })
    expect(summary.duplicates).toBe(1)
    expect(s).not.toHaveBeenCalled()
  })

  it('does not send a reminder already logged for this expiry date', async () => {
    mockDb.rows = world({ plan: 'growth', log: [{ certificateId: CERT, daysBefore: 7, expiryDate: inDays(7), status: 'sent', attempts: 1 }] })
    const s = send()
    const summary = await runExpiryReminders({ now: NOW, send: s })
    expect(summary.notDue).toBe(1)
    expect(s).not.toHaveBeenCalled()
    expect(mockDb.calls.some((c) => c.op === 'insert')).toBe(false)
  })

  it('a reminder still being sent by another run is not sent again', async () => {
    mockDb.rows = world({ plan: 'growth', log: [{ certificateId: CERT, daysBefore: 7, expiryDate: inDays(7), status: 'sending', attempts: 1 }] })
    const s = send()
    await runExpiryReminders({ now: NOW, send: s })
    expect(s).not.toHaveBeenCalled()
  })

  it('sends again when the expiry date has changed (renewed or edited)', async () => {
    mockDb.rows = world({ plan: 'growth', log: [{ certificateId: CERT, daysBefore: 7, expiryDate: inDays(-358), status: 'sent', attempts: 1 }] })
    const s = send()
    expect((await runExpiryReminders({ now: NOW, send: s })).sent).toBe(1)
  })

  it('retries a failed send, up to the attempt limit', async () => {
    const failed = (attempts: number) => [{ certificateId: CERT, daysBefore: 7, expiryDate: inDays(7), status: 'failed', attempts }]
    mockDb.rows = world({ plan: 'growth', log: failed(1) })
    let s = send()
    expect((await runExpiryReminders({ now: NOW, send: s })).sent).toBe(1)
    const retry = mockDb.calls.find((c) => c.op === 'update' && c.set?.status === 'sending')!
    expect(sqlOf(retry)).toMatch(/"status" = \$\d+/)
    expect(params(retry)).toEqual(expect.arrayContaining(['failed', MAX_REMINDER_ATTEMPTS]))
    expect(mockDb.calls.some((c) => c.op === 'insert')).toBe(false)

    mockDb.calls = []
    mockDb.rows = world({ plan: 'growth', log: failed(MAX_REMINDER_ATTEMPTS) })
    s = send()
    await runExpiryReminders({ now: NOW, send: s })
    expect(s).not.toHaveBeenCalled()

    // Another run grabbed the retry first
    mockDb.rows = world({ plan: 'growth', log: failed(1), retryClaim: [] })
    s = send()
    expect((await runExpiryReminders({ now: NOW, send: s })).duplicates).toBe(1)
    expect(s).not.toHaveBeenCalled()
  })

  it('logs a failed send as failed', async () => {
    mockDb.rows = world({ plan: 'growth' })
    const summary = await runExpiryReminders({ now: NOW, send: jest.fn(async () => ({ success: false, error: 'boom' })) })
    expect(summary.failed).toBe(1)
    expect(mockDb.calls.find((c) => c.op === 'update' && c.set?.status === 'failed')?.set.error).toBe('boom')
  })

  it('sends nothing when the reminder log is missing (sql/007 not run)', async () => {
    mockDb.rows = world({ plan: 'growth', log: 'missing' })
    const s = send()
    const summary = await runExpiryReminders({ now: NOW, send: s })
    expect(summary.ok).toBe(false)
    expect(summary.reason).toMatch(/sql\/007/)
    expect(s).not.toHaveBeenCalled()
  })

  it('stops reminders when the plan lacks them (Free, Starter, or after a downgrade)', async () => {
    for (const plan of [undefined, 'free', 'starter']) {
      mockDb.calls = []
      mockDb.rows = world({ plan })
      const s = send()
      const summary = await runExpiryReminders({ now: NOW, send: s })
      expect(summary.skippedPlan).toBe(1)
      expect(s).not.toHaveBeenCalled()
      expect(mockDb.calls.some((c) => c.op !== 'select')).toBe(false)
      // Saved settings are left alone
      expect(mockDb.calls.some((c) => c.table === 'course_reminder_settings')).toBe(false)
    }
  })

  it('skips programs with reminders turned off', async () => {
    mockDb.rows = world({ plan: 'growth', settings: [{ courseId: COURSE, enabled: false }] })
    const s = send()
    expect((await runExpiryReminders({ now: NOW, send: s })).skippedDisabled).toBe(1)
    expect(s).not.toHaveBeenCalled()
  })

  it('only looks at live certificates expiring in the next 30 days', async () => {
    mockDb.rows = world({ plan: 'growth', candidates: [] })
    await runExpiryReminders({ now: NOW, send: send() })
    const q = mockDb.calls[0]
    expect(q.table).toBe('certificates')
    expect(params(q)).toEqual(expect.arrayContaining(['published', NOW.toISOString(), inDays(30).toISOString()]))
    expect(sqlOf(q)).toMatch(/"revoked_at" is null/)
  })

  it('uses branded sender details only when the plan includes branded email', async () => {
    mockDb.rows = world({ plan: 'growth' })
    const s = send()
    await runExpiryReminders({ now: NOW, send: s })
    const { identity } = (s.mock.calls[0] as any)[0].content
    expect(identity.fromName).toBe('Acme Certificates')
    expect(identity.replyTo).toBe('help@acme.example')
  })

  it('the default sender is the Resend path (mocked here, no real email)', async () => {
    mockDb.rows = world({ plan: 'business' })
    await runExpiryReminders({ now: NOW })
    expect(sendExpiryReminderEmail).toHaveBeenCalledTimes(1)
  })

  it('handledReminderDays ignores other certificates, other expiry dates and retryable failures', () => {
    const exp = inDays(7)
    const rows = [
      { certificateId: CERT, daysBefore: 30, expiryDate: exp, status: 'sent', attempts: 1 },
      { certificateId: CERT, daysBefore: 7, expiryDate: exp, status: 'failed', attempts: 1 },
      { certificateId: CERT, daysBefore: 7, expiryDate: inDays(100), status: 'sent', attempts: 1 },
      { certificateId: 'other', daysBefore: 7, expiryDate: exp, status: 'sent', attempts: 1 },
    ]
    expect(handledReminderDays(rows, CERT, exp)).toEqual([30])
  })
})

// ---------------------------------------------------------------------------
describe('reminder email copy', () => {
  const base = {
    learnerName: 'Ada Lovelace',
    courseName: 'First Aid',
    academyName: 'Acme Training',
    academySenderName: 'Acme Certificates',
    academyReplyTo: 'help@acme.example',
    certificateNumber: 'ABC123',
    certificateUrl: 'https://example.test/c/ABC123',
    expiryDate: new Date('2026-07-10T00:00:00Z'),
    daysLeft: 30,
  }

  it('has the expected subject and body', () => {
    const c = expiryReminderContent({ ...base, branding: { branded: true } })
    expect(c.subject).toBe('Your First Aid certificate expires in 30 days')
    expect(c.text).toBe(
      [
        'Hi Ada Lovelace,',
        'Your First Aid certificate from Acme Training expires on July 10, 2026.',
        'To keep your certification current, contact Acme Training about renewing before then. After that date, your certificate page will show it as expired.',
        'View your certificate: https://example.test/c/ABC123?recipient=true&utm_source=email&utm_medium=expiry_reminder',
        'Certificate number: ABC123',
        'Questions? Reply to this email or contact help@acme.example',
        "You're receiving this because Acme Training issued you this certificate.",
        `Verified by ${BRAND.name}`,
      ].join('\n\n')
    )
    expect(c.html).toContain('View certificate')
    expect(c.html).toContain(`Verified by ${BRAND.name}`)
  })

  it('says "tomorrow" on the last day', () => {
    expect(expiryReminderContent({ ...base, daysLeft: 1, branding: { branded: true } }).subject).toBe('Your First Aid certificate expires tomorrow')
  })

  it('is unbranded below Starter-level branded email (platform sender, no reply-to)', () => {
    const c = expiryReminderContent({ ...base, branding: { branded: false } })
    expect(c.identity.fromName).toBe(BRAND.name)
    expect(c.identity.replyTo).toBeUndefined()
    expect(c.text).toContain('Questions about this certificate? Contact Acme Training.')
  })

  it('escapes names in the HTML', () => {
    const c = expiryReminderContent({ ...base, learnerName: '<script>x</script>', branding: { branded: true } })
    expect(c.html).not.toContain('<script>x</script>')
    expect(c.html).toContain('&lt;script&gt;')
  })
})

// ---------------------------------------------------------------------------
describe('cron auth', () => {
  const original = process.env.CRON_SECRET
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it('isAuthorizedCron needs the exact bearer secret', () => {
    expect(isAuthorizedCron('Bearer s3cret', 's3cret')).toBe(true)
    expect(isAuthorizedCron('Bearer wrong', 's3cret')).toBe(false)
    expect(isAuthorizedCron('Bearer s3cret ', 's3cret')).toBe(false)
    expect(isAuthorizedCron('s3cret', 's3cret')).toBe(false)
    expect(isAuthorizedCron(null, 's3cret')).toBe(false)
    expect(isAuthorizedCron('Bearer ', '')).toBe(false)
    expect(isAuthorizedCron('Bearer undefined', undefined)).toBe(false)
  })

  const req = (auth?: string) =>
    new NextRequest('http://localhost/api/cron/expiry-reminders', auth ? { headers: { Authorization: auth } } : undefined)

  it('rejects missing, wrong or unconfigured secrets without touching the database', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    expect((await cronGET(req())).status).toBe(401)
    expect((await cronGET(req('Bearer nope'))).status).toBe(401)
    delete process.env.CRON_SECRET
    expect((await cronGET(req('Bearer test-cron-secret'))).status).toBe(401)
    expect(mockDb.calls).toHaveLength(0)
    expect(sendExpiryReminderEmail).not.toHaveBeenCalled()
  })

  it('runs with the right secret and returns counts only', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    mockDb.rows = () => []
    const res = await cronGET(req('Bearer test-cron-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ ok: true, checked: 0, sent: 0 })
    expect(JSON.stringify(body)).not.toContain('test-cron-secret')
  })

  it('returns 500 (not the error) when the run fails', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    mockDb.rows = () => {
      throw new Error('db down: secret details')
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await cronGET(req('Bearer test-cron-secret'))
    spy.mockRestore()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('secret details')
  })

  it('is scheduled daily in vercel.json next to the keep-alive cron', () => {
    const vercel = JSON.parse(src('vercel.json'))
    expect(vercel.crons).toEqual(
      expect.arrayContaining([
        { path: '/api/keep-alive', schedule: '0 15 * * *' },
        { path: '/api/cron/expiry-reminders', schedule: '0 16 * * *' },
      ])
    )
  })

  it('the route uses the shared cron check', () => {
    expect(src('app/api/cron/expiry-reminders/route.ts')).toContain("isAuthorizedCron(request.headers.get('authorization'))")
  })
})

// ---------------------------------------------------------------------------
describe('sql/007', () => {
  const sql = src('sql/007-expiry-reminders.sql')
  const statements = sql.replace(/--[^\n]*/g, '').replace(/ON DELETE CASCADE/g, '')
  it('is additive and re-runnable', () => {
    expect(statements).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|ALTER COLUMN)\b/i)
    for (const s of statements.match(/CREATE (TABLE|INDEX)[^\n]*/g) ?? []) expect(s).toMatch(/IF NOT EXISTS/)
  })
  it('has the duplicate guard and per-program settings', () => {
    expect(sql).toMatch(/UNIQUE \(certificate_id, days_before, expiry_date\)/)
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS course_reminder_settings/)
    expect(sql).toMatch(/enabled boolean NOT NULL DEFAULT true/)
    expect(sql).toMatch(/ALTER TABLE expiry_reminders ENABLE ROW LEVEL SECURITY/)
    expect(sql).toMatch(/ALTER TABLE course_reminder_settings ENABLE ROW LEVEL SECURITY/)
  })
})
