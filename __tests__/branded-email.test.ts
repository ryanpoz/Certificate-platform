/**
 * Branded email (sender name + reply-to) is Starter and up, enforced server-side.
 * Free accounts send from the platform name with no custom reply-to and keep the
 * "Verified by" footer. Saved branding settings are kept on Free, never applied.
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { BRAND } from '@/lib/config/brand'
import { emailBrandingFor, emailIdentity } from '@/lib/email/branding'
import { PLAN_ORDER } from '@/lib/billing/plans'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')
const ACADEMY = { name: 'Acme Training', senderName: 'Acme Certificates', replyTo: 'certs@acme.example' }

describe('emailBrandingFor / emailIdentity', () => {
  it('branding is Starter and up only', () => {
    expect(PLAN_ORDER.map((p) => emailBrandingFor(p).branded)).toEqual([false, true, true, true])
    expect(emailBrandingFor(null).branded).toBe(false)
    expect(emailBrandingFor('mystery' as any).branded).toBe(false)
  })

  it('Free: platform sender, no reply-to, saved settings not used', () => {
    const id = emailIdentity({ branded: false }, ACADEMY)
    expect(id.fromName).toBe(BRAND.name)
    expect(id.replyTo).toBeUndefined()
    expect(JSON.stringify(id)).not.toContain(ACADEMY.senderName)
    expect(JSON.stringify(id)).not.toContain(ACADEMY.replyTo)
    expect(id.contactLine).toContain(ACADEMY.name)
  })

  it('Starter+: account sender name and reply-to', () => {
    expect(emailIdentity({ branded: true }, ACADEMY)).toEqual({
      fromName: 'Acme Certificates',
      replyTo: 'certs@acme.example',
      contactLine: 'Questions? Reply to this email or contact certs@acme.example',
    })
  })
})

describe('sendCertificateEmail applies branding only when entitled', () => {
  const mockSend = jest.fn(async (_args: any) => ({ data: { id: 'm1' }, error: null }))
  const base = {
    to: 'learner@example.com',
    learnerName: 'Lee',
    courseName: 'Safety 101',
    certificateNumber: 'SAF-ABC',
    issueDate: new Date('2026-11-01'),
    expiryDate: null,
    academyName: ACADEMY.name,
    academySenderName: ACADEMY.senderName,
    academyReplyTo: ACADEMY.replyTo,
    emailSubject: 'Your certificate',
    emailBody: 'Well done {{learnerName}}',
    certificateUrl: 'https://certs.example/c/SAF-ABC',
  }

  let send: typeof import('@/lib/email/resend').sendCertificateEmail
  beforeAll(async () => {
    jest.resetModules()
    process.env.RESEND_API_KEY = 'test-key-not-real'
    jest.doMock('resend', () => ({ Resend: jest.fn(() => ({ emails: { send: mockSend } })) }))
    jest.doMock('nanoid', () => ({ nanoid: () => 'ABCDEFGH', customAlphabet: () => () => 'ABCD' }))
    send = (await import('@/lib/email/resend')).sendCertificateEmail
  })
  afterAll(() => {
    delete process.env.RESEND_API_KEY
    jest.dontMock('resend')
  })
  beforeEach(() => mockSend.mockClear())

  it('Free: from the platform, no Reply-To, saved branding absent, Verified-by footer kept', async () => {
    await send({ ...base, branding: emailBrandingFor('free') })
    const args = mockSend.mock.calls[0][0]
    expect(args.from).toBe(`${BRAND.name} <onboarding@resend.dev>`)
    expect(args).not.toHaveProperty('replyTo')
    expect(args.html).not.toContain(ACADEMY.senderName)
    expect(args.html).not.toContain(ACADEMY.replyTo)
    expect(args.html).toContain(`Verified by ${BRAND.name}`)
  })

  it('Starter: from the account sender name with its reply-to, footer kept', async () => {
    await send({ ...base, branding: emailBrandingFor('starter') })
    const args = mockSend.mock.calls[0][0]
    expect(args.from).toBe('Acme Certificates <onboarding@resend.dev>')
    expect(args.replyTo).toBe(ACADEMY.replyTo)
    expect(args.html).toContain(ACADEMY.replyTo)
    expect(args.html).toContain(`Verified by ${BRAND.name}`)
  })

  it('branding is a required parameter', () => {
    expect(read('lib/email/resend.ts')).toMatch(/\n  branding: EmailBranding\n/)
  })
})

describe('getEmailBranding resolves the plan server-side', () => {
  beforeEach(() => jest.resetModules())

  it('unbranded when the plan cannot be read', async () => {
    jest.doMock('@/lib/db', () => ({ db: { select: () => { throw new Error('no table') } } }))
    const { getEmailBranding } = await import('@/lib/billing/usage')
    expect(await getEmailBranding('acct')).toEqual({ branded: false })
  })

  it('branded for a stored Starter plan', async () => {
    const chain: any = { from: () => chain, where: () => chain, limit: async () => [{ plan: 'starter', customLimit: null }] }
    jest.doMock('@/lib/db', () => ({ db: { select: () => chain } }))
    const { getEmailBranding } = await import('@/lib/billing/usage')
    expect(await getEmailBranding('acct')).toEqual({ branded: true })
  })
})

describe('every certificate email path passes server-resolved branding', () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(join(process.cwd(), dir))) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const rel = join(dir, name)
      if (statSync(join(process.cwd(), rel)).isDirectory()) walk(rel, out)
      else if (/\.(ts|tsx)$/.test(name)) out.push(rel)
    }
    return out
  }
  const sources = [...walk('app'), ...walk('lib'), ...walk('components')]

  it('the only senders are single issue, the wizard, and publishCertificates', () => {
    const senders = sources.filter((f) => /sendCertificateEmail\(\{/.test(read(f))).sort()
    expect(senders).toEqual(['app/dashboard/certificates/issue/actions.ts', 'app/dashboard/wizard/actions.ts', 'lib/import/actions.ts'])
  })

  it.each([
    ['single issue', 'app/dashboard/certificates/issue/actions.ts', 'branding: await getEmailBranding(data.academyId)'],
    ['wizard bulk send', 'app/dashboard/wizard/actions.ts', 'const emailBranding = await getEmailBranding(academyId)'],
    ['publish (bulk publish, CSV import, republish, reissue, single publish)', 'lib/import/actions.ts', 'const emailBranding = await getEmailBranding(account.academyId)'],
  ])('%s', (_name, file, resolve) => {
    const src = read(file)
    expect(src).toContain(resolve)
    const call = src.slice(src.indexOf('sendCertificateEmail({'))
    expect(call.slice(0, call.indexOf('})'))).toMatch(/branding: (emailBranding|await getEmailBranding\(data\.academyId\))/)
  })

  it('republish, reissue, bulk publish and single publish all go through publishCertificates', () => {
    const actions = read('app/dashboard/certificates/actions.ts')
    expect(actions).toContain('await publishCertificates([certificateId])') // republish
    expect(actions).toContain('const result = await publishCertificates(certIds)') // bulk publish (filtered)
    expect(actions).toMatch(/source: 'reissue'[\s\S]{0,80}status|status: 'unpublished'[\s\S]{0,120}source: 'reissue'/) // reissue creates a draft, emailed on publish
    expect(read('app/dashboard/certificates/publish-button.tsx')).toContain('publishCertificates(certificateIds)')
    expect(read('app/dashboard/certificates/[id]/actions-panel.tsx')).toContain('publishCertificates([certificateId])')
  })

  it('nothing outside the branding module can force branding on', () => {
    for (const f of sources) {
      if (f === 'lib/email/branding.ts') continue
      expect([f, /branded:\s*true/.test(read(f))]).toEqual([f, false])
    }
  })

  it('previews and test sends never email', () => {
    const imp = read('lib/import/actions.ts')
    expect(imp).toContain('if (!cert.certificate.isPreview) {')
    expect(imp).toContain('sql`coalesce(${certificates.isPreview}, false) = false`')
  })
})

// --- Behavioural: each send path, Free vs Starter -------------------------

const USER = { id: 'u1', academyId: 'acct-1', email: 'owner@example.com', name: 'Owner' }
const ROW: any = {
  id: 'cert-1', number: 'SAF-ABC', code: 'SAF', name: 'Safety 101', fullName: 'Lee', email: 'lee@example.com',
  academyId: 'acct-1', courseId: 'course-1', learnerId: 'l1', templateId: 't1', status: 'unpublished', isPreview: false,
  issueDate: new Date('2026-11-01'), expiryDate: null, createdAt: new Date('2026-01-01'), publishedAt: null, source: 'csv',
  emailSubject: 'Subj', emailBody: 'Body', senderName: ACADEMY.senderName, replyTo: ACADEMY.replyTo, validityMonths: null,
  custom: {}, designConfig: {}, bodyText: '',
}
ROW.certificate = ROW; ROW.course = ROW; ROW.learner = ROW; ROW.academy = { ...ROW, name: ACADEMY.name }; ROW.template = ROW

function setupPath(plan: 'free' | 'starter') {
  jest.resetModules()
  const sent: any[] = []
  const chain: any = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (res: any, rej: any) => Promise.resolve([ROW]).then(res, rej)
      return () => chain
    },
  })
  jest.doMock('@/lib/db', () => ({ db: { select: () => chain, insert: () => chain, update: () => chain, delete: () => chain } }))
  jest.doMock('@/lib/utils/session', () => ({ getCurrentUser: jest.fn(async () => USER), requireAuth: jest.fn(async () => USER) }))
  jest.doMock('next/cache', () => ({ revalidatePath: jest.fn() }))
  jest.doMock('nanoid', () => ({ nanoid: () => 'ABCDEFGH', customAlphabet: () => () => 'ABCD' }))
  jest.doMock('@/lib/learners', () => ({
    findOrCreateLearner: jest.fn(async () => ROW),
    normalizeLearnerEmail: (e: string) => e.toLowerCase(),
    learnerByEmailQuery: jest.fn(),
  }))
  jest.doMock('@/lib/email/resend', () => ({ sendCertificateEmail: jest.fn(async (p: any) => { sent.push(p); return { success: true } }) }))
  jest.doMock('@/lib/billing/usage', () => {
    const { emailBrandingFor } = jest.requireActual('@/lib/email/branding')
    const { resolvePlan } = jest.requireActual('@/lib/billing/plans')
    return {
      checkCanIssue: jest.fn(async () => ({ allowed: true, remaining: 100 })),
      getAcademyPlan: jest.fn(async () => resolvePlan(plan)),
      getEmailBranding: jest.fn(async () => emailBrandingFor(plan)),
      recordBillableDeletions: jest.fn(async () => 0),
      accountCan: jest.fn(async () => plan !== 'free'),
    }
  })
  return sent
}

describe.each(['free', 'starter'] as const)('send paths on %s', (plan) => {
  const expected = { branded: plan !== 'free' }

  it('single issue', async () => {
    const sent = setupPath(plan)
    const { issueSingleCertificateAction } = await import('@/app/dashboard/certificates/issue/actions')
    await issueSingleCertificateAction({
      learnerName: 'Lee', learnerEmail: 'lee@example.com', issueDate: '2026-11-01', programId: 'course-1',
      defaultTemplateId: 't1', academyId: 'acct-1', userId: 'u1',
    })
    expect(sent.length).toBe(1)
    expect(sent[0].branding).toEqual(expected)
  })

  it('publish (bulk, CSV, republish, reissue)', async () => {
    const sent = setupPath(plan)
    const { publishCertificates } = await import('@/lib/import/actions')
    await publishCertificates(['cert-1'])
    expect(sent.length).toBe(1)
    expect(sent[0].branding).toEqual(expected)
  })

  it('wizard bulk send', async () => {
    const sent = setupPath(plan)
    const { createCertificateFromWizard } = await import('@/app/dashboard/wizard/actions')
    await createCertificateFromWizard({
      academyId: 'acct-1', userId: 'u1', certificateName: 'Safety', templateConfig: {}, programName: 'Safety',
      recipients: [{ name: 'Lee', email: 'lee@example.com' }, { name: 'Sam', email: 'sam@example.com' }],
    } as any)
    expect(sent.length).toBe(2)
    for (const s of sent) expect(s.branding).toEqual(expected)
  })
})

describe('saving branding settings on Free', () => {
  function setupSettings(plan: 'free' | 'starter') {
    jest.resetModules()
    const updates: any[] = []
    const chain: any = new Proxy({}, {
      get(_t, prop) {
        if (prop === 'then') return (res: any, rej: any) => Promise.resolve([]).then(res, rej)
        if (prop === 'set') return (v: any) => { updates.push(v); return chain }
        return () => chain
      },
    })
    jest.doMock('@/lib/db', () => ({ db: { update: () => chain, select: () => chain } }))
    jest.doMock('@/lib/utils/session', () => ({ getCurrentUser: jest.fn(async () => USER) }))
    jest.doMock('next/cache', () => ({ revalidatePath: jest.fn() }))
    jest.doMock('nanoid', () => ({ nanoid: () => 'ABCDEFGH', customAlphabet: () => () => 'ABCD' }))
    jest.doMock('@/lib/billing/usage', () => ({ accountCan: jest.fn(async (_a: string, f: string) => f === 'brandedEmail' && plan !== 'free') }))
    return updates
  }
  const form = { name: 'Acme', brandColor: '#000000', website: '', senderName: 'Hacked Sender', replyTo: 'new@acme.example' }

  it('Free: saves the other settings but never writes (or clears) sender name / reply-to', async () => {
    const updates = setupSettings('free')
    const { updateAcademySettings } = await import('@/app/dashboard/settings/actions')
    expect(await updateAcademySettings('acct-1', form)).toEqual({ success: true, emailBrandingLocked: true })
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ name: 'Acme' })
    expect(updates[0]).not.toHaveProperty('senderName')
    expect(updates[0]).not.toHaveProperty('replyTo')
  })

  it('Free: blank branding fields are not required and nothing is cleared', async () => {
    const updates = setupSettings('free')
    const { updateAcademySettings } = await import('@/app/dashboard/settings/actions')
    expect(await updateAcademySettings('acct-1', { ...form, senderName: '', replyTo: '' })).toMatchObject({ success: true })
    expect(updates[0]).not.toHaveProperty('senderName')
  })

  it('Starter: saves sender name and reply-to', async () => {
    const updates = setupSettings('starter')
    const { updateAcademySettings } = await import('@/app/dashboard/settings/actions')
    expect(await updateAcademySettings('acct-1', form)).toEqual({ success: true, emailBrandingLocked: false })
    expect(updates[0]).toMatchObject({ senderName: 'Hacked Sender', replyTo: 'new@acme.example' })
  })

  it('Starter: still requires sender name and reply-to', async () => {
    setupSettings('starter')
    const { updateAcademySettings } = await import('@/app/dashboard/settings/actions')
    expect(await updateAcademySettings('acct-1', { ...form, replyTo: '' })).toHaveProperty('error')
  })

  it('settings page shows the locked state with a Starter plan link to /pricing', () => {
    const page = read('app/dashboard/settings/page.tsx')
    expect(page).toContain("accountCan(user.academyId, 'brandedEmail')")
    const formSrc = read('app/dashboard/settings/form.tsx')
    expect(formSrc).toContain('<PlanBadgeLink feature="brandedEmail" />')
    expect(formSrc.match(/disabled=\{!canBrandEmail\}/g)?.length).toBe(2)
    expect(formSrc).toContain('apply when you upgrade to Starter')
    const badge = read('components/dashboard/locked-feature.tsx')
    expect(badge).toContain('href={UPGRADE_URL}')
    expect(badge).toContain('{requiredPlanName(feature)} plan')
  })
})
