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
    expect(wizard).toContain('templateConfig?.version === 3')
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
