import { readFileSync } from 'fs'
import { join } from 'path'

describe('Wizard Fabric builder integration', () => {
  const wizard = readFileSync(
    join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'),
    'utf-8'
  )

  it('uses Fabric editor instead of Konva VisualEditor', () => {
    expect(wizard).toContain('FabricEditorClient')
    expect(wizard).toContain("mode=\"wizard\"")
    expect(wizard).not.toContain('VisualEditor')
    expect(wizard).not.toContain('STARTER_TEMPLATES.map')
  })

  it('persists DesignConfigV3 from Fabric onSave', () => {
    expect(wizard).toContain('DesignConfigV3')
    expect(wizard).toContain('handleEditorSave')
    expect(wizard).toContain('createBlankLandscapeTemplate')
  })

  it('keeps top bar with certificate name and Next', () => {
    expect(wizard).toContain('Certificate name')
    expect(wizard).toContain('Next: Add Recipients')
    expect(wizard).toContain('Full-Width Fabric Editor')
  })

  it('only restores v3 drafts into the editor', () => {
    expect(wizard).toContain('config?.version === 3')
    expect(wizard).toContain('applyV3Design')
  })

  it('loads drafts before mounting the editor and keeps the draft URL', () => {
    expect(wizard).toContain('draftLoading')
    expect(wizard).toContain('loadDraft')
    expect(wizard).toContain('/dashboard/wizard?draft=')
    expect(wizard).toContain('Loading draft')
  })
})

describe('Wizard draft reopen', () => {
  it('awaits searchParams so ?draft= / ?edit= are passed into the wizard', () => {
    const page = readFileSync(
      join(process.cwd(), 'app/dashboard/wizard/page.tsx'),
      'utf-8'
    )
    expect(page).toContain('await searchParams')
    expect(page).toContain('draftId={params.draft}')
    expect(page).toContain('editCourseId={params.edit}')
  })

  it('lists drafts separately with Continue editing (issued keep View / Issue more)', () => {
    const certs = readFileSync(
      join(process.cwd(), 'app/dashboard/certificates/page.tsx'),
      'utf-8'
    )
    expect(certs).toContain('draftData')
    expect(certs).toContain('Drafts')
    expect(certs).toContain('Continue editing')
    expect(certs).toContain('/dashboard/wizard?draft=')
    expect(certs).toContain('Issue more')
    expect(certs).not.toContain('/dashboard/wizard?edit=')
  })

  it('redirects draft course pages back into the wizard', () => {
    const course = readFileSync(
      join(process.cwd(), 'app/dashboard/courses/[id]/page.tsx'),
      'utf-8'
    )
    expect(course).toContain('draftData')
    expect(course).toContain('/dashboard/wizard?draft=')
  })

  it('does not autosave-create a new certificates row until Save Draft', () => {
    const wizardSrc = readFileSync(
      join(process.cwd(), 'app/dashboard/wizard/wizard.tsx'),
      'utf-8'
    )
    expect(wizardSrc).toContain('Autosave existing drafts only')
    expect(wizardSrc).toContain('if (isAutosave && !draftId && !isEditingPublished) return')
  })
})

describe('Fabric editor embeddable API', () => {
  const editor = readFileSync(
    join(process.cwd(), 'app/dashboard/lab/fabric/fabric-editor.tsx'),
    'utf-8'
  )

  it('accepts initialConfig, onSave, and mode props', () => {
    expect(editor).toContain('FabricEditorProps')
    expect(editor).toContain('initialConfig')
    expect(editor).toContain('onSave')
    expect(editor).toContain("mode = 'lab'")
    expect(editor).toContain('fabricToDesignConfig')
  })
})
