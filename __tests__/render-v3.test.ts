import {
  renderCertificateV3,
  renderCertificateV3Page,
  getV3PageSize,
} from '@/lib/certificate-builder/render-v3'
import type { DesignConfigV3 } from '@/lib/design-config/v3-schema'
import { createBlankLandscapeTemplate } from '@/app/dashboard/lab/fabric/blank-template'
import { createLinearGradientBackground, createImageBackground } from '@/lib/fabric/background'

const sampleData = {
  recipientName: 'Alex Rivera',
  certificateTitle: 'Excellence Award',
  orgName: 'Acme Academy',
  issueDate: 'October 28, 2026',
  certificateId: 'CERT-123',
  description: 'Completed with distinction',
  issuerName: 'Dr. Lee',
}

describe('renderCertificateV3', () => {
  it('returns page size from the first page', () => {
    const design = createBlankLandscapeTemplate()
    expect(getV3PageSize(design)).toEqual({ width: 1123, height: 794 })
  })

  it('substitutes field values into HTML', () => {
    const design = createBlankLandscapeTemplate()
    const html = renderCertificateV3(design, sampleData)
    expect(html).toContain('Alex Rivera')
    expect(html).toContain('Excellence Award')
    expect(html).toContain('1123px')
    expect(html).toContain('794px')
    expect(html).not.toContain('Recipient Name') // placeholder replaced
  })

  it('renders solid and gradient backgrounds', () => {
    const solid: DesignConfigV3 = {
      version: 3,
      pages: [{
        width: 800,
        height: 600,
        unit: 'px',
        background: { type: 'color', color: '#ff00aa' },
        elements: [],
      }],
    }
    expect(renderCertificateV3Page(solid, sampleData)).toContain('background-color: #ff00aa')

    const gradient: DesignConfigV3 = {
      version: 3,
      pages: [{
        width: 800,
        height: 600,
        unit: 'px',
        background: createLinearGradientBackground(800, 600, '#111', '#eee', 90),
        elements: [],
      }],
    }
    expect(renderCertificateV3Page(gradient, sampleData)).toContain('linear-gradient')
  })

  it('renders image backgrounds and image elements', () => {
    const design: DesignConfigV3 = {
      version: 3,
      pages: [{
        width: 800,
        height: 600,
        unit: 'px',
        background: createImageBackground('data:image/png;base64,abc', 0.5),
        elements: [{
          type: 'image',
          id: 'logo',
          imageUrl: 'data:image/png;base64,xyz',
          fit: 'contain',
          cornerRadius: 8,
          x: 10,
          y: 10,
          width: 100,
          height: 50,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          originX: 'left',
          originY: 'top',
          opacity: 1,
        }],
      }],
    }
    const html = renderCertificateV3Page(design, sampleData)
    expect(html).toContain("url('data:image/png;base64,abc')")
    expect(html).toContain('data:image/png;base64,xyz')
    expect(html).toContain('border-radius: 8px')
  })

  it('escapes HTML in text content', () => {
    const design: DesignConfigV3 = {
      version: 3,
      pages: [{
        width: 400,
        height: 300,
        unit: 'px',
        background: { type: 'color', color: '#fff' },
        elements: [{
          type: 'text',
          id: 't1',
          text: '<script>alert(1)</script>',
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 'normal',
          fontStyle: 'normal',
          fill: '#000',
          textAlign: 'left',
          underline: false,
          strikethrough: false,
          x: 0,
          y: 0,
          width: 200,
          height: 40,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          originX: 'left',
          originY: 'top',
          opacity: 1,
        }],
      }],
    }
    const html = renderCertificateV3Page(design, sampleData)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert')
  })
})
