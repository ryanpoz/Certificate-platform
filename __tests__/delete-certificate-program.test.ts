/**
 * Tests for deleting a published certificate program and its issued certificates.
 */
import { readFileSync } from 'fs'
import { join } from 'path'

describe('deleteCertificateProgram', () => {
  const actions = readFileSync(
    join(process.cwd(), 'app/dashboard/certificates/actions.ts'),
    'utf-8'
  )

  it('is a server action that requires the signed-in user to own the academy', () => {
    expect(actions).toMatch(/^'use server'/)
    expect(actions).toContain('export async function deleteCertificateProgram')
    expect(actions).toContain('getCurrentUser')
    expect(actions).toContain('user.academyId !== academyId')
    expect(actions).toContain('eq(courses.academyId, user.academyId)')
  })

  it('deletes dependent events, issued certificates, and batches before the course', () => {
    const eventsIdx = actions.indexOf('db.delete(events)')
    const certsIdx = actions.indexOf('db.delete(certificates)')
    const batchesIdx = actions.indexOf('db.delete(batches)')
    const courseIdx = actions.indexOf('db.delete(courses)')

    expect(eventsIdx).toBeGreaterThan(-1)
    expect(certsIdx).toBeGreaterThan(eventsIdx)
    expect(batchesIdx).toBeGreaterThan(certsIdx)
    expect(courseIdx).toBeGreaterThan(batchesIdx)
    expect(actions).toContain('inArray(events.certificateId, certIds)')
    expect(actions).toContain('eq(batches.courseId, courseId)')
  })

  it('removes the linked template only when no other course uses it', () => {
    expect(actions).toContain('eq(courses.templateId, templateId)')
    expect(actions).toContain('db.delete(templates)')
    expect(actions).toContain('stillUsed.length === 0')
  })

  it('revalidates the certificates page', () => {
    expect(actions).toContain("revalidatePath('/dashboard')")
    expect(actions).toContain("revalidatePath('/dashboard/certificates')")
  })
})

describe('ProgramActions UI', () => {
  const page = readFileSync(
    join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
    'utf-8'
  )
  const ui = readFileSync(
    join(process.cwd(), 'app/dashboard/certificates/program-actions.tsx'),
    'utf-8'
  )

  it('is a client component wired into the certificates table', () => {
    expect(ui).toMatch(/^'use client'/)
    expect(page).toContain('ProgramActions')
    expect(page).toContain('issuedCount={metrics.issued}')
  })

  it('confirms before delete and warns that issued certificates will be removed', () => {
    expect(ui).toContain('confirm(')
    expect(ui).toContain('issued certificate')
    expect(ui).toContain('deleteCertificateProgram')
    expect(ui).toContain("This can’t be undone.")
  })
})

describe('deleteDraft cascade', () => {
  const actions = readFileSync(
    join(process.cwd(), 'app/dashboard/wizard/actions.ts'),
    'utf-8'
  )

  it('requires the signed-in user to own the draft and only deletes drafts', () => {
    expect(actions).toContain('export async function deleteDraft')
    expect(actions).toContain('getCurrentUser')
    expect(actions).toContain('eq(courses.academyId, user.academyId)')
    expect(actions).toContain("Only drafts can be deleted from this action")
    expect(actions).toContain("course.code.startsWith('DRAFT-')")
  })

  it('deletes leftover preview or issued rows so a draft course can be removed', () => {
    expect(actions).toContain('db.delete(events)')
    expect(actions).toContain('db.delete(certificates)')
    expect(actions).toContain('db.delete(batches)')
    expect(actions).toContain('db.delete(courses)')
    expect(actions).toContain('db.delete(templates)')
  })
})
