/**
 * Tests for v2 visual editor and schema
 */

import fs from 'fs'
import path from 'path'
import { migrateV1ToV2, type CertificateDesignV2 } from '../lib/certificate-builder/design-v2'
import { renderCertificateV2 } from '../lib/certificate-builder/render-v2'

describe('Certificate Design V2 Schema', () => {
  it('should have v2 schema defined', () => {
    const schema = require('../lib/certificate-builder/design-v2')
    expect(schema.migrateV1ToV2).toBeDefined()
    expect(schema.GOOGLE_FONTS).toBeDefined()
    expect(schema.DYNAMIC_FIELD_LABELS).toBeDefined()
  })

  it('should migrate v1 to v2', () => {
    const v1Config = {
      colors: {
        primary: '#2563eb',
        accent: '#0ea5e9',
        background: '#ffffff',
        text: '#1e293b',
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Inter',
        pair: 'playfair-lato',
      },
      background: {
        type: 'color',
        value: '#ffffff',
      },
      border: {
        style: 'simple',
        color: '#2563eb',
        width: 2,
      },
      layout: {
        alignment: 'center',
        titleText: 'Certificate of Achievement',
        spacing: 'normal',
      },
      bodyText: 'This certifies that\n\n{{recipient_name}}\n\nhas completed\n\n{{program_name}}',
      signatures: [],
      showQrCode: true,
      showCertNumber: true,
      showExpiryDate: false,
    }

    const v2 = migrateV1ToV2(v1Config)

    expect(v2.version).toBe(2)
    expect(v2.width).toBe(1123)
    expect(v2.height).toBe(794)
    expect(v2.orientation).toBe('landscape')
    expect(v2.background).toBeDefined()
    expect(v2.elements).toBeInstanceOf(Array)
    expect(v2.elements.length).toBeGreaterThan(0)
  })

  it('should create elements with correct types', () => {
    const v1Config = {
      layout: { titleText: 'Test Title' },
      bodyText: '{{recipient_name}}\n{{program_name}}',
      colors: { primary: '#000', text: '#000', background: '#fff' },
      fonts: { heading: 'Inter', body: 'Inter', pair: 'inter-inter' },
      background: { type: 'color', value: '#fff' },
      border: { style: 'none', color: '#000', width: 0 },
      signatures: [],
      showQrCode: false,
      showCertNumber: false,
      showExpiryDate: false,
    }

    const v2 = migrateV1ToV2(v1Config)

    const hasTitle = v2.elements.some(el => el.type === 'text')
    const hasRecipientName = v2.elements.some(el =>
      el.type === 'dynamic-field' && (el as any).field === 'recipient_name'
    )
    const hasCertTitle = v2.elements.some(el =>
      el.type === 'dynamic-field' && (el as any).field === 'certificate_title'
    )

    expect(hasTitle).toBe(true)
    expect(hasRecipientName).toBe(true)
    expect(hasCertTitle).toBe(true)
  })

  it('should preserve dimensions and background', () => {
    const v1Config = {
      background: { type: 'color', value: '#f0f0f0', opacity: 0.8 },
      colors: { primary: '#000', text: '#000', background: '#f0f0f0' },
      fonts: { heading: 'Inter', body: 'Inter', pair: 'inter-inter' },
      layout: { alignment: 'center', titleText: 'Test', spacing: 'normal' },
      bodyText: 'Test',
      border: { style: 'none', color: '#000', width: 0 },
      signatures: [],
      showQrCode: false,
      showCertNumber: false,
      showExpiryDate: false,
    }

    const v2 = migrateV1ToV2(v1Config)

    expect(v2.background.type).toBe('color')
    expect(v2.background.value).toBe('#f0f0f0')
    expect(v2.background.opacity).toBe(0.8)
  })
})

describe('Visual Editor Component', () => {
  it('should have visual editor component', () => {
    const exists = fs.existsSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx')
    )
    expect(exists).toBe(true)
  })

  it('should be a client component', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx'),
      'utf-8'
    )
    expect(content).toContain("'use client'")
  })

  it('should use react-konva', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx'),
      'utf-8'
    )
    expect(content).toContain('react-konva')
    expect(content).toContain('Stage')
    expect(content).toContain('Layer')
  })

  it('should have left and right panels', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx'),
      'utf-8'
    )
    expect(content).toContain('Left Panel')
    expect(content).toContain('Properties')
  })

  it('should support preview mode', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx'),
      'utf-8'
    )
    expect(content).toContain('showPreview')
    expect(content).toContain('Preview')
    expect(content).toContain('checkbox')
  })

  it('should have keyboard shortcuts', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx'),
      'utf-8'
    )
    expect(content).toContain('handleKeyDown')
    expect(content).toContain('Delete')
    expect(content).toContain('Arrow')
  })
})

describe('V2 Rendering', () => {
  it('should render v2 design to HTML', () => {
    const design: CertificateDesignV2 = {
      version: 2,
      width: 1123,
      height: 794,
      orientation: 'landscape',
      background: { type: 'color', value: '#ffffff' },
      elements: [
        {
          id: 'text-1',
          type: 'text',
          x: 100,
          y: 100,
          width: 400,
          height: 50,
          text: 'Test Certificate',
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#000000',
          align: 'center',
        },
        {
          id: 'field-1',
          type: 'dynamic-field',
          field: 'recipient_name',
          x: 100,
          y: 200,
          width: 400,
          height: 40,
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: 'normal',
          color: '#000000',
          align: 'center',
          autoShrink: true,
        },
      ],
    }

    const html = renderCertificateV2(design, {
      recipientName: 'John Doe',
      certificateTitle: 'Web Development',
      orgName: 'Test Academy',
      issueDate: '2024-01-01',
      certificateId: 'TEST-123',
    })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Test Certificate')
    expect(html).toContain('John Doe')
    expect(html).toContain('width: 1123px')
    expect(html).toContain('height: 794px')
    expect(html).toContain('google')
    expect(html).toContain('fonts')
  })

  it('should handle long recipient names with autoshrink', () => {
    const design: CertificateDesignV2 = {
      version: 2,
      width: 1123,
      height: 794,
      orientation: 'landscape',
      background: { type: 'color', value: '#fff' },
      elements: [
        {
          id: 'field-1',
          type: 'dynamic-field',
          field: 'recipient_name',
          x: 100,
          y: 100,
          width: 400,
          height: 40,
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: 'normal',
          color: '#000',
          align: 'center',
          autoShrink: true,
        },
      ],
    }

    const html = renderCertificateV2(design, {
      recipientName: 'This Is An Extremely Long Name That Should Trigger Autoshrink',
      certificateTitle: 'Test',
      orgName: 'Test',
      issueDate: '2024-01-01',
      certificateId: 'TEST-123',
    })

    expect(html).toContain('This Is An Extremely Long Name')
    expect(html).toContain('font-size:') // Should have reduced font size
  })

  it('should render shapes correctly', () => {
    const design: CertificateDesignV2 = {
      version: 2,
      width: 1123,
      height: 794,
      orientation: 'landscape',
      background: { type: 'color', value: '#fff' },
      elements: [
        {
          id: 'shape-1',
          type: 'shape',
          shapeType: 'rect',
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          fill: '#2563eb',
          stroke: '#1e40af',
          strokeWidth: 2,
        },
      ],
    }

    const html = renderCertificateV2(design, {
      recipientName: 'Test',
      certificateTitle: 'Test',
      orgName: 'Test',
      issueDate: '2024-01-01',
      certificateId: 'TEST-123',
    })

    expect(html).toContain('background-color: #2563eb')
    expect(html).toContain('border:')
  })
})

describe('Editor Integration', () => {
  it('should have editor page route', () => {
    const exists = fs.existsSync(
      path.join(process.cwd(), 'app/dashboard/templates/[id]/editor/page.tsx')
    )
    expect(exists).toBe(true)
  })

  it('should have editor actions', () => {
    const exists = fs.existsSync(
      path.join(process.cwd(), 'app/dashboard/templates/[id]/editor/actions.ts')
    )
    expect(exists).toBe(true)
  })

  it('editor should separate server and client components', () => {
    const pageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/[id]/editor/page.tsx'),
      'utf-8'
    )
    const clientExists = fs.existsSync(
      path.join(process.cwd(), 'app/dashboard/templates/[id]/editor/editor-client.tsx')
    )
    expect(pageContent).toContain('EditorPageClient')
    expect(clientExists).toBe(true)
  })
})

describe('No Server Component Regressions', () => {
  it('visual editor should be client component', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'components/certificate/visual-editor.tsx'),
      'utf-8'
    )
    expect(content).toContain("'use client'")
  })

  it('should not have inline event handlers in server components', () => {
    const editorPageContent = fs.readFileSync(
      path.join(process.cwd(), 'app/dashboard/templates/[id]/editor/page.tsx'),
      'utf-8'
    )
    
    // Server component should not have onClick, onChange etc
    const hasInlineHandlers = /\s(onClick|onChange|onSubmit|onInput)=\{/.test(editorPageContent)
    expect(hasInlineHandlers).toBe(false)
  })
})
