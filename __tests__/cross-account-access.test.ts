/**
 * Regression: server actions reject cross-account access.
 *
 * The database is replaced with a recorder, the session belongs to account B,
 * and every action is called with account A's IDs. Each action must refuse,
 * never insert, and scope every read/update/delete to account B.
 */
import { PgDialect } from 'drizzle-orm/pg-core'

const ACCOUNT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ACCOUNT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const USER_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const A_RESOURCE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

type MockCall = { op: string; where: any[] }
const mockDb: { calls: MockCall[]; rows: (call: MockCall) => any[] } = { calls: [], rows: () => [] }

function mockChain(call: MockCall): any {
  const proxy: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: any, reject: any) => Promise.resolve(mockDb.rows(call)).then(resolve, reject)
        }
        if (prop === 'where') {
          return (cond: any) => {
            call.where.push(cond)
            return proxy
          }
        }
        return () => proxy
      },
    }
  )
  return proxy
}

jest.mock('@/lib/db', () => {
  const start = (op: string) => () => {
    const call = { op, where: [] as any[] }
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

const dialect = new PgDialect()
function compiled(call: MockCall) {
  return call.where.map((w) => dialect.sqlToQuery(w))
}

beforeEach(() => {
  mockDb.calls = []
  mockDb.rows = () => []
  mockSession.user = { id: USER_B, academyId: ACCOUNT_B, email: 'b@example.com', name: 'B' }
})

/** Every recorded read/update/delete is scoped to account B; nothing inserted; account A never queried */
function expectScopedToB() {
  for (const call of mockDb.calls) {
    expect(call.op).not.toBe('insert')
    if (call.op === 'update' || call.op === 'delete') {
      const parts = compiled(call)
      expect(parts.some((q) => q.sql.includes('academy_id') && q.params.includes(ACCOUNT_B))).toBe(true)
    }
    for (const q of compiled(call)) {
      expect(q.params).not.toContain(ACCOUNT_A)
    }
  }
}

async function settle<T>(p: Promise<T>): Promise<{ value?: T; error?: unknown }> {
  try {
    return { value: await p }
  } catch (error) {
    return { error }
  }
}

describe('actions that take an academyId refuse another account without touching the database', () => {
  const cases: Array<[string, () => Promise<any>]> = [
    ['wizard saveDraft', async () => (await import('@/app/dashboard/wizard/actions')).saveDraft({
      academyId: ACCOUNT_A, userId: USER_B, certificateName: 'x', templateConfig: {}, currentStep: 1, recipients: [],
    })],
    ['wizard savePublishedDesign', async () => (await import('@/app/dashboard/wizard/actions')).savePublishedDesign({
      courseId: A_RESOURCE, academyId: ACCOUNT_A, certificateName: 'x', templateConfig: {},
    })],
    ['wizard createCertificateFromWizard', async () => (await import('@/app/dashboard/wizard/actions')).createCertificateFromWizard({
      academyId: ACCOUNT_A, userId: USER_B, certificateName: 'x', templateConfig: {}, recipients: [{ name: 'n', email: 'n@x.com' }],
    })],
    ['single issue', async () => (await import('@/app/dashboard/certificates/issue/actions')).issueSingleCertificateAction({
      learnerName: 'n', learnerEmail: 'n@x.com', issueDate: '2026-01-01', programId: A_RESOURCE, defaultTemplateId: A_RESOURCE, academyId: ACCOUNT_A, userId: USER_B,
    })],
    ['publishCertificatesFiltered', async () => (await import('@/app/dashboard/certificates/actions')).publishCertificatesFiltered(ACCOUNT_A, {})],
    ['revokeCertificatesFiltered', async () => (await import('@/app/dashboard/certificates/actions')).revokeCertificatesFiltered(ACCOUNT_A, {}, 'r')],
    ['exportCertificatesToCSVFiltered', async () => (await import('@/app/dashboard/certificates/actions')).exportCertificatesToCSVFiltered(ACCOUNT_A, {})],
    ['getExistingLearnerEmails', async () => (await import('@/lib/import/actions')).getExistingLearnerEmails(ACCOUNT_A, A_RESOURCE)],
    ['createDraftsFromValidation', async () => (await import('@/lib/import/actions')).createDraftsFromValidation(ACCOUNT_A, A_RESOURCE, USER_B, [], 'f.csv', {})],
    ['createSingleCertificate', async () => (await import('@/lib/import/actions')).createSingleCertificate(ACCOUNT_A, A_RESOURCE, USER_B, {
      name: 'n', email: 'n@x.com', issueDate: new Date(), custom: {}, publish: true,
    })],
    ['duplicateTemplateAction', async () => (await import('@/app/dashboard/templates/actions')).duplicateTemplateAction(A_RESOURCE, ACCOUNT_A)],
    ['setDefaultTemplateAction', async () => (await import('@/app/dashboard/templates/actions')).setDefaultTemplateAction(A_RESOURCE, ACCOUNT_A)],
    ['createTemplateFromStarterAction', async () => (await import('@/app/dashboard/templates/new/actions')).createTemplateFromStarterAction('modern', ACCOUNT_A)],
    ['createCourse', async () => (await import('@/app/dashboard/courses/actions')).createCourse(ACCOUNT_A, {
      name: 'n', code: 'C', description: '', validityMonths: '', ctaLabel: '', ctaUrl: '',
    })],
    ['createCustomField', async () => (await import('@/app/dashboard/courses/actions')).createCustomField(ACCOUNT_A, {
      key: 'k', label: 'l', type: 'text', showOnCertificate: true,
    })],
    ['updateAcademySettings', async () => (await import('@/app/dashboard/settings/actions')).updateAcademySettings(ACCOUNT_A, {
      name: 'n', brandColor: '#000', website: '', senderName: 's', replyTo: 'r@x.com',
    })],
  ]

  it.each(cases)('%s', async (_name, run) => {
    const result = await settle(run())
    const refused =
      result.error !== undefined ||
      (result.value && typeof result.value === 'object' && 'error' in (result.value as any)) ||
      (Array.isArray(result.value) && result.value.length === 0)
    expect(refused).toBe(true)
    expect(mockDb.calls).toEqual([])
  })

  it('checkFirstTimeUser does not reveal another account', async () => {
    const { checkFirstTimeUser } = await import('@/app/dashboard/wizard/actions')
    expect(await checkFirstTimeUser(ACCOUNT_A)).toBe(false)
    expect(mockDb.calls).toEqual([])
  })
})

describe('actions that take a resource ID only read and write within the signed-in account', () => {
  const cases: Array<[string, () => Promise<any>]> = [
    ['wizard loadDraft', async () => (await import('@/app/dashboard/wizard/actions')).loadDraft(A_RESOURCE)],
    ['wizard loadCourseForEdit', async () => (await import('@/app/dashboard/wizard/actions')).loadCourseForEdit(A_RESOURCE)],
    ['wizard saveDraft (existing draft)', async () => (await import('@/app/dashboard/wizard/actions')).saveDraft({
      academyId: ACCOUNT_B, userId: USER_B, draftId: A_RESOURCE, certificateName: 'x', templateConfig: {}, currentStep: 1, recipients: [],
    })],
    ['wizard savePublishedDesign', async () => (await import('@/app/dashboard/wizard/actions')).savePublishedDesign({
      courseId: A_RESOURCE, academyId: ACCOUNT_B, certificateName: 'x', templateConfig: {}, templateId: A_RESOURCE,
    })],
    ['wizard deleteDraft', async () => (await import('@/app/dashboard/wizard/actions')).deleteDraft(A_RESOURCE)],
    ['publishCertificates', async () => (await import('@/lib/import/actions')).publishCertificates([A_RESOURCE])],
    ['revokeCertificates', async () => (await import('@/app/dashboard/certificates/actions')).revokeCertificates([A_RESOURCE], 'r')],
    ['exportCertificatesToCSV', async () => (await import('@/app/dashboard/certificates/actions')).exportCertificatesToCSV([A_RESOURCE])],
    ['editCertificate', async () => (await import('@/app/dashboard/certificates/actions')).editCertificate(A_RESOURCE, {
      learnerName: 'n', issueDate: new Date(), custom: {},
    })],
    ['discardPendingChanges', async () => (await import('@/app/dashboard/certificates/actions')).discardPendingChanges(A_RESOURCE)],
    ['republishCertificate', async () => (await import('@/app/dashboard/certificates/actions')).republishCertificate(A_RESOURCE, true)],
    ['reissueCertificate', async () => (await import('@/app/dashboard/certificates/actions')).reissueCertificate(A_RESOURCE)],
    ['revokeSingleCertificate', async () => (await import('@/app/dashboard/certificates/actions')).revokeSingleCertificate(A_RESOURCE, 'r')],
    ['deleteCertificateProgram', async () => (await import('@/app/dashboard/certificates/actions')).deleteCertificateProgram(A_RESOURCE, ACCOUNT_B)],
    ['deleteTemplateAction', async () => (await import('@/app/dashboard/templates/actions')).deleteTemplateAction(A_RESOURCE)],
    ['setDefaultTemplateAction', async () => (await import('@/app/dashboard/templates/actions')).setDefaultTemplateAction(A_RESOURCE, ACCOUNT_B)],
    ['renameTemplateAction', async () => (await import('@/app/dashboard/templates/actions')).renameTemplateAction(A_RESOURCE, 'New')],
    ['saveTemplateDesign', async () => (await import('@/app/dashboard/templates/[id]/editor/actions')).saveTemplateDesign(A_RESOURCE, {})],
    ['updateTemplateAction', async () => (await import('@/app/dashboard/templates/[id]/actions')).updateTemplateAction(A_RESOURCE, {
      name: 'n', designConfig: {}, bodyText: 'b',
    })],
    ['updateCourse', async () => (await import('@/app/dashboard/courses/actions')).updateCourse(A_RESOURCE, {
      name: 'n', code: 'C', description: '', validityMonths: '', ctaLabel: '', ctaUrl: '',
    })],
    ['updateTemplate', async () => (await import('@/app/dashboard/courses/actions')).updateTemplate(A_RESOURCE, {
      bodyText: 'b', emailSubject: 's', emailBody: 'e',
    })],
    ['deleteCustomField', async () => (await import('@/app/dashboard/courses/actions')).deleteCustomField(A_RESOURCE)],
  ]

  it.each(cases)('%s', async (_name, run) => {
    await settle(run())
    expectScopedToB()
    // Reads that filter by ID also filter by account B
    const scopedReads = mockDb.calls.filter((c) => c.op === 'select' && c.where.length > 0)
    for (const call of scopedReads) {
      const parts = compiled(call)
      const touchesId = parts.some((q) => q.params.includes(A_RESOURCE))
      if (touchesId) {
        expect(parts.some((q) => q.params.includes(ACCOUNT_B))).toBe(true)
      }
    }
  })

  it('publishCertificates refuses IDs that are not all owned by the signed-in account', async () => {
    const { publishCertificates } = await import('@/lib/import/actions')
    const result = await publishCertificates([A_RESOURCE])
    expect(result).toEqual({ published: 0, error: 'Not found' })
    expect(mockDb.calls.filter((c) => c.op === 'update')).toEqual([])
  })
})

describe('signed-out callers are refused', () => {
  beforeEach(() => {
    mockSession.user = null
  })

  it.each([
    ['loadDraft', async () => (await import('@/app/dashboard/wizard/actions')).loadDraft(A_RESOURCE)],
    ['publishCertificates', async () => (await import('@/lib/import/actions')).publishCertificates([A_RESOURCE])],
    ['renameTemplateAction', async () => (await import('@/app/dashboard/templates/actions')).renameTemplateAction(A_RESOURCE, 'x')],
    ['deleteCustomField', async () => (await import('@/app/dashboard/courses/actions')).deleteCustomField(A_RESOURCE)],
  ] as Array<[string, () => Promise<any>]>)('%s', async (_name, run) => {
    const result = await settle(run())
    expect(result.error !== undefined || (result.value as any)?.error).toBeTruthy()
    expect(mockDb.calls).toEqual([])
  })
})

describe('sample certificate at signup', () => {
  it('is refused for an existing account that is not the signed-in one', async () => {
    mockSession.user = null
    mockDb.rows = (call) =>
      call.op === 'select' ? [{ id: ACCOUNT_A, name: 'A', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), senderName: 'A', replyTo: 'a@x.com' }] : []
    const { createSampleCertificate } = await import('@/app/dashboard/wizard/actions')
    const result = await createSampleCertificate(ACCOUNT_A, USER_B)
    expect(result).toEqual({ error: 'Not found' })
    expect(mockDb.calls.filter((c) => c.op === 'insert')).toEqual([])
  })
})

describe('isSameAccount', () => {
  it('only matches two equal, non-empty account IDs', async () => {
    const { isSameAccount } = await import('@/lib/auth/ownership')
    expect(isSameAccount(ACCOUNT_B, ACCOUNT_B)).toBe(true)
    expect(isSameAccount(ACCOUNT_B, ACCOUNT_A)).toBe(false)
    expect(isSameAccount(ACCOUNT_B, '')).toBe(false)
    expect(isSameAccount('', '')).toBe(false)
    expect(isSameAccount(null, null)).toBe(false)
    expect(isSameAccount(undefined, ACCOUNT_B)).toBe(false)
  })
})
