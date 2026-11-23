/**
 * Regression: learners are always looked up by email WITHIN the issuing account,
 * so another account's learner with the same email is never matched.
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { learnerByEmailQuery } from '@/lib/learners'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

const ACCOUNT_A = '11111111-1111-1111-1111-111111111111'
const ACCOUNT_B = '22222222-2222-2222-2222-222222222222'

describe('learnerByEmailQuery', () => {
  it('filters by both account and normalised email', () => {
    const { sql, params } = learnerByEmailQuery(ACCOUNT_A, '  Jane@Example.COM ').toSQL()
    expect(sql).toMatch(/"learners"\."academy_id" = \$1/)
    expect(sql).toMatch(/"learners"\."email_normalised" = \$2/)
    expect(sql).toMatch(/ and /i)
    expect(params[0]).toBe(ACCOUNT_A)
    expect(params[1]).toBe('jane@example.com')
  })

  it('never reuses another account for the same email', () => {
    const a = learnerByEmailQuery(ACCOUNT_A, 'jane@example.com').toSQL()
    const b = learnerByEmailQuery(ACCOUNT_B, 'jane@example.com').toSQL()
    expect(a.sql).toBe(b.sql)
    expect(a.params).toContain(ACCOUNT_A)
    expect(a.params).not.toContain(ACCOUNT_B)
    expect(b.params).toContain(ACCOUNT_B)
    expect(b.params).not.toContain(ACCOUNT_A)
  })
})

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

describe('every learner email lookup is account-scoped', () => {
  const files = ['app', 'lib', 'components'].flatMap((d) => sourceFiles(join(process.cwd(), d)))

  it('pairs each eq(learners.emailNormalised ...) with eq(learners.academyId ...)', () => {
    const offenders: string[] = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf-8').split('\n')
      lines.forEach((line, i) => {
        if (line.includes('eq(learners.emailNormalised')) {
          const window = lines.slice(Math.max(0, i - 4), i + 2).join('\n')
          if (!window.includes('eq(learners.academyId')) offenders.push(`${file}:${i + 1}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('issuing paths use the scoped helper', () => {
    expect(read('app/dashboard/certificates/issue/actions.ts')).toContain(
      'findOrCreateLearner(data.academyId, data.learnerName, data.learnerEmail)'
    )
    expect(read('app/dashboard/wizard/actions.ts')).toContain(
      'findOrCreateLearner(academyId, recipient.name, recipient.email)'
    )
    expect(read('lib/import/actions.ts')).toContain('findOrCreateLearner(academyId, data.name, data.email)')
  })

  it('single issue only issues for the signed-in account and its own programs', () => {
    const src = read('app/dashboard/certificates/issue/actions.ts')
    expect(src).toContain('user.academyId !== data.academyId')
    expect(src).toContain('eq(courses.academyId, data.academyId)')
    expect(src).toContain('eq(templates.academyId, data.academyId)')
  })

  it('wizard issuing checks the signed-in account and scopes the draft', () => {
    const src = read('app/dashboard/wizard/actions.ts')
    const fn = src.slice(src.indexOf('export async function createCertificateFromWizard'))
    expect(fn).toContain('user.academyId !== academyId')
    expect(fn).toContain('and(eq(courses.id, draftId), eq(courses.academyId, academyId))')
  })
})

describe('signup Google retry link', () => {
  it('points at the real /auth/google route', () => {
    const form = read('app/(marketing)/signup/form.tsx')
    expect(form).toContain("window.location.href = '/auth/google'")
    expect(form).not.toContain('/api/auth/google')
  })
})

describe('normalizeLearnerEmail', () => {
  it('matches the shared normalizeEmail rule', () => {
    const { normalizeLearnerEmail } = require('@/lib/learners')
    expect(normalizeLearnerEmail('  Jane@Example.COM ')).toBe('jane@example.com')
  })
})
