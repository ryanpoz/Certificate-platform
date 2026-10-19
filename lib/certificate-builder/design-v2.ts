/**
 * Certificate Design Config V2 - Visual Editor Schema
 * 
 * This replaces the form-based v1 config with a canvas-based design
 * that stores element positions, sizes, and properties as JSON.
 */

export interface CertificateDesignV2 {
  version: 2
  width: number // e.g. 1123 (landscape) or 794 (portrait)
  height: number // e.g. 794 (landscape) or 1123 (portrait)
  orientation: 'landscape' | 'portrait'
  background: BackgroundConfig
  elements: DesignElement[]
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image'
  value: string // hex color, gradient CSS, or image URL/data URL
  opacity?: number
}

export type DesignElement =
  | TextElement
  | DynamicFieldElement
  | ImageElement
  | SignatureElement
  | ShapeElement
  | QRCodeElement

interface BaseElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  locked?: boolean
  zIndex?: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  color: string
  align: 'left' | 'center' | 'right'
  letterSpacing?: number
  lineHeight?: number
}

export interface DynamicFieldElement extends BaseElement {
  type: 'dynamic-field'
  field: 'recipient_name' | 'certificate_title' | 'org_name' | 'date' | 'certificate_id' | 'description'
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  color: string
  align: 'left' | 'center' | 'right'
  autoShrink?: boolean // for long recipient names
  letterSpacing?: number
  lineHeight?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string // URL or data URL
  opacity?: number
}

export interface SignatureElement extends BaseElement {
  type: 'signature'
  signatureType: 'image' | 'text'
  src?: string // for image signatures
  text?: string // for text signatures
  fontFamily?: string // script font for text
  fontSize?: number
  color?: string
  title?: string // e.g. "Director"
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shapeType: 'rect' | 'circle' | 'line' | 'border' | 'frame'
  fill?: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number // for rects
}

export interface QRCodeElement extends BaseElement {
  type: 'qr-code'
  showLink?: boolean
}

// Migration from v1 to v2
export function migrateV1ToV2(v1Config: any): CertificateDesignV2 {
  // Default dimensions: landscape 1123x794
  const width = 1123
  const height = 794

  const elements: DesignElement[] = []
  let nextY = 100

  // Migrate logo
  if (v1Config.logo?.url) {
    elements.push({
      id: `logo-${Date.now()}`,
      type: 'image',
      x: width / 2 - 100,
      y: 50,
      width: 200,
      height: 80,
      src: v1Config.logo.url,
    })
    nextY = 150
  }

  // Migrate title text from layout
  if (v1Config.layout?.titleText) {
    elements.push({
      id: `title-${Date.now()}`,
      type: 'text',
      x: width / 2 - 300,
      y: nextY,
      width: 600,
      height: 60,
      text: v1Config.layout.titleText,
      fontFamily: v1Config.fonts?.heading || 'Inter',
      fontSize: 48,
      fontWeight: 'bold',
      color: v1Config.colors?.primary || '#000000',
      align: 'center',
    })
    nextY += 100
  }

  // Migrate body text as dynamic fields
  if (v1Config.bodyText) {
    // Parse body text for merge fields and create dynamic field elements
    const bodyLines = v1Config.bodyText.split('\n')
    bodyLines.forEach((line: string, idx: number) => {
      if (line.includes('{{recipient_name}}') || line.includes('{{learnerName}}')) {
        elements.push({
          id: `field-name-${idx}`,
          type: 'dynamic-field',
          field: 'recipient_name',
          x: width / 2 - 250,
          y: nextY + idx * 50,
          width: 500,
          height: 40,
          fontFamily: v1Config.fonts?.body || 'Inter',
          fontSize: 32,
          fontWeight: 'bold',
          color: v1Config.colors?.text || '#000000',
          align: 'center',
          autoShrink: true,
        })
      } else if (line.includes('{{program_name}}') || line.includes('{{courseName}}')) {
        elements.push({
          id: `field-title-${idx}`,
          type: 'dynamic-field',
          field: 'certificate_title',
          x: width / 2 - 250,
          y: nextY + idx * 50,
          width: 500,
          height: 40,
          fontFamily: v1Config.fonts?.body || 'Inter',
          fontSize: 24,
          fontWeight: 'normal',
          color: v1Config.colors?.text || '#000000',
          align: 'center',
        })
      } else if (line.trim()) {
        elements.push({
          id: `text-${idx}`,
          type: 'text',
          x: width / 2 - 300,
          y: nextY + idx * 50,
          width: 600,
          height: 40,
          text: line,
          fontFamily: v1Config.fonts?.body || 'Inter',
          fontSize: 18,
          fontWeight: 'normal',
          color: v1Config.colors?.text || '#000000',
          align: 'center',
        })
      }
    })
    nextY += bodyLines.length * 50 + 50
  }

  // Migrate signatures
  if (v1Config.signatures?.length > 0) {
    const sigWidth = 200
    const sigSpacing = (width - v1Config.signatures.length * sigWidth) / (v1Config.signatures.length + 1)
    
    v1Config.signatures.forEach((sig: any, idx: number) => {
      elements.push({
        id: `sig-${idx}`,
        type: 'signature',
        signatureType: sig.type,
        x: sigSpacing + idx * (sigWidth + sigSpacing),
        y: height - 150,
        width: sigWidth,
        height: 60,
        src: sig.type === 'image' ? sig.value : undefined,
        text: sig.type === 'text' ? sig.value : undefined,
        fontFamily: sig.font || 'Allura',
        fontSize: 32,
        color: v1Config.colors?.text || '#000000',
        title: sig.title,
      })
    })
  }

  // Migrate border
  if (v1Config.border?.style !== 'none') {
    elements.push({
      id: `border-${Date.now()}`,
      type: 'shape',
      shapeType: 'border',
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      stroke: v1Config.border?.color || v1Config.colors?.primary || '#000000',
      strokeWidth: v1Config.border?.width || 2,
    })
  }

  // Add QR code if enabled
  if (v1Config.showQrCode) {
    elements.push({
      id: `qr-${Date.now()}`,
      type: 'qr-code',
      x: width - 150,
      y: height - 150,
      width: 120,
      height: 120,
      showLink: true,
    })
  }

  return {
    version: 2,
    width,
    height,
    orientation: 'landscape',
    background: {
      type: v1Config.background?.type || 'color',
      value: v1Config.background?.value || v1Config.colors?.background || '#ffffff',
      opacity: v1Config.background?.opacity,
    },
    elements,
  }
}

// Curated Google Fonts list
export const GOOGLE_FONTS = [
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Lora',
  'Merriweather',
  'Poppins',
  'Space Grotesk',
  'Allura', // script
  'Dancing Script', // script
  'Great Vibes', // script
  'Pacifico', // script
  'Roboto',
  'Open Sans',
  'PT Sans',
]

// Dynamic field labels
export const DYNAMIC_FIELD_LABELS = {
  recipient_name: 'Recipient Name',
  certificate_title: 'Certificate Title',
  org_name: 'Organization Name',
  date: 'Issue Date',
  certificate_id: 'Certificate ID',
  description: 'Description',
}

// Get sample data for preview
export function getSampleData() {
  return {
    recipient_name: 'John Doe',
    certificate_title: 'Advanced Web Development',
    org_name: 'Tech Academy',
    date: new Date().toLocaleDateString(),
    certificate_id: 'CERT-ABC12345',
    description: 'For outstanding achievement in completing the advanced web development program',
  }
}
