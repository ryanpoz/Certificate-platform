import { type CertificateDesignV2, type DesignElement, type TextElement, type DynamicFieldElement, type ShapeElement, type ImageElement, type SignatureElement, type QRCodeElement } from './design-v2'
import { DOMParser } from '@xmldom/xmldom'

export interface TemplateMeta {
  id: string
  name: string
  orientation: 'landscape' | 'portrait'
  width: number
  height: number
  fonts: string[]
  palette: string[]
  tags: string[]
}

const FIELD_MAP: Record<string, string> = {
  'recipient_name': 'recipient_name',
  'certificate_title': 'certificate_title',
  'org_name': 'org_name',
  'description': 'description',
  'issue_date': 'issue_date',
  'credential_id': 'credential_id',
  'signature_1': 'signature_1',
  'signer_1_name': 'signer_1_name',
  'signer_1_title': 'signer_1_title',
  'org_tagline': 'org_tagline',
}

export function importSVGTemplate(svgContent: string, meta: TemplateMeta): CertificateDesignV2 {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'text/xml')
  const svg = doc.documentElement

  const elements: DesignElement[] = []
  let elementCounter = 1

  // Parse background
  let background: CertificateDesignV2['background'] = { type: 'color', value: '#ffffff' }
  const bgRect = doc.getElementById('deco_background')?.getElementsByTagName('rect')[0]
  if (bgRect) {
    const fill = bgRect.getAttribute('fill') || '#ffffff'
    if (fill.startsWith('url(#')) {
      const gradId = fill.slice(5, -1)
      const gradient = doc.getElementById(gradId)
      if (gradient) {
        background = { type: 'gradient', value: serializeGradient(gradient) }
      }
    } else {
      background = { type: 'color', value: fill }
    }
  }

  // Helper to get transform translate values
  function getTransform(element: Element): { x: number; y: number } {
    const transform = element.getAttribute('transform')
    if (transform) {
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
      if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
      }
    }
    return { x: 0, y: 0 }
  }

  // Parse all text elements
  const textElements = svg.getElementsByTagName('text')
  for (let i = 0; i < textElements.length; i++) {
    const textEl = textElements[i]
    const id = textEl.getAttribute('id') || ''
    
    // Skip labels - we'll convert them to static text
    if (id.startsWith('label_') || id.startsWith('badge_')) {
      const x = parseFloat(textEl.getAttribute('x') || '0')
      const y = parseFloat(textEl.getAttribute('y') || '0')
      const fontSize = parseFloat(textEl.getAttribute('font-size') || '12')
      const fill = textEl.getAttribute('fill') || '#000000'
      const fontFamily = extractFontFamily(textEl.getAttribute('font-family') || '')
      const fontWeight = textEl.getAttribute('font-weight') || 'normal'
      const textAnchor = textEl.getAttribute('text-anchor') || 'start'
      const textContent = getTextContent(textEl)

      elements.push({
        id: `element-${elementCounter++}`,
        type: 'text',
        x,
        y: y - fontSize,
        width: 300,
        height: fontSize * 1.5,
        text: textContent,
        fontFamily,
        fontSize,
        fontWeight: fontWeight === 'bold' || parseInt(fontWeight) >= 600 ? 'bold' : 'normal',
        color: fill,
        align: textAnchor === 'middle' ? 'center' : textAnchor === 'end' ? 'right' : 'left',
      } as TextElement)
      continue
    }

    // Map to dynamic fields
    if (FIELD_MAP[id]) {
      const x = parseFloat(textEl.getAttribute('x') || '0')
      const y = parseFloat(textEl.getAttribute('y') || '0')
      const fontSize = parseFloat(textEl.getAttribute('font-size') || '24')
      const fill = textEl.getAttribute('fill') || '#000000'
      const fontFamily = extractFontFamily(textEl.getAttribute('font-family') || '')
      const fontWeight = textEl.getAttribute('font-weight') || 'normal'
      const textAnchor = textEl.getAttribute('text-anchor') || 'start'

      const element: DynamicFieldElement = {
        id: `element-${elementCounter++}`,
        type: 'dynamic-field',
        field: FIELD_MAP[id] as any,
        x,
        y: y - fontSize,
        width: estimateWidth(id, fontSize),
        height: fontSize * 1.5,
        fontFamily,
        fontSize,
        fontWeight: fontWeight === 'bold' || parseInt(fontWeight) >= 600 ? 'bold' : 'normal',
        color: fill,
        align: textAnchor === 'middle' ? 'center' : textAnchor === 'end' ? 'right' : 'left',
        autoShrink: id === 'recipient_name',
      }

      // Handle multi-line (tspan)
      const tspans = textEl.getElementsByTagName('tspan')
      if (tspans.length > 1) {
        const lines: string[] = []
        for (let j = 0; j < tspans.length; j++) {
          lines.push(tspans[j].textContent || '')
        }
        element.height = fontSize * tspans.length * 1.3
      }

      elements.push(element)
    } else if (id === 'signature_1') {
      // Signature (script text)
      const x = parseFloat(textEl.getAttribute('x') || '0')
      const y = parseFloat(textEl.getAttribute('y') || '0')
      const fontSize = parseFloat(textEl.getAttribute('font-size') || '32')
      const fill = textEl.getAttribute('fill') || '#000000'
      const fontFamily = extractFontFamily(textEl.getAttribute('font-family') || '')
      const textContent = getTextContent(textEl)

      elements.push({
        id: `element-${elementCounter++}`,
        type: 'signature',
        signatureType: 'text',
        x,
        y: y - fontSize,
        width: 250,
        height: fontSize * 2,
        text: textContent,
        fontFamily,
        fontSize,
        color: fill,
        title: '',
      } as SignatureElement)
    }
  }

  // Parse QR code if present
  const qrGroup = doc.getElementById('qr_code')
  if (qrGroup) {
    const rect = qrGroup.getElementsByTagName('rect')[0]
    if (rect) {
      const x = parseFloat(rect.getAttribute('x') || '0')
      const y = parseFloat(rect.getAttribute('y') || '0')
      const width = parseFloat(rect.getAttribute('width') || '100')
      const height = parseFloat(rect.getAttribute('height') || '100')

      elements.push({
        id: `element-${elementCounter++}`,
        type: 'qr-code',
        x,
        y,
        width,
        height,
        showLink: true,
      } as QRCodeElement)
    }
  }

  // Parse logo placeholder
  const logoGroup = doc.getElementById('logo')
  if (logoGroup) {
    const rect = logoGroup.getElementsByTagName('rect')[0]
    if (rect) {
      const x = parseFloat(rect.getAttribute('x') || '0')
      const y = parseFloat(rect.getAttribute('y') || '0')
      const width = parseFloat(rect.getAttribute('width') || '140')
      const height = parseFloat(rect.getAttribute('height') || '48')

      elements.push({
        id: `element-${elementCounter++}`,
        type: 'image',
        x,
        y,
        width,
        height,
        src: '',
      } as ImageElement)
    }
  }

  // Parse decorative shapes (borders, frames, accents)
  parseDecoShapes(doc, elements, elementCounter)

  return {
    version: 2,
    width: meta.width,
    height: meta.height,
    orientation: meta.orientation,
    background,
    elements,
  }
}

function serializeGradient(gradient: Element): string {
  const type = gradient.tagName
  if (type === 'linearGradient') {
    const x1 = gradient.getAttribute('x1') || '0'
    const y1 = gradient.getAttribute('y1') || '0'
    const x2 = gradient.getAttribute('x2') || '1'
    const y2 = gradient.getAttribute('y2') || '1'
    
    const stops = gradient.getElementsByTagName('stop')
    const stopStrings: string[] = []
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i]
      const offset = stop.getAttribute('offset') || '0'
      const color = stop.getAttribute('stop-color') || '#000000'
      stopStrings.push(`${color} ${parseFloat(offset) * 100}%`)
    }
    
    return `linear-gradient(to bottom right, ${stopStrings.join(', ')})`
  }
  
  return 'linear-gradient(to right, #000000, #ffffff)'
}

function extractFontFamily(fontFamilyAttr: string): string {
  // Extract first font from "'Font Name', fallback, sans-serif"
  const match = fontFamilyAttr.match(/'([^']+)'/)
  if (match) return match[1]
  
  const parts = fontFamilyAttr.split(',')
  return parts[0].trim().replace(/'/g, '')
}

function getTextContent(element: Element): string {
  const tspans = element.getElementsByTagName('tspan')
  if (tspans.length > 0) {
    const lines: string[] = []
    for (let i = 0; i < tspans.length; i++) {
      lines.push(tspans[i].textContent || '')
    }
    return lines.join('\n')
  }
  return element.textContent || ''
}

function estimateWidth(id: string, fontSize: number): number {
  // Estimate element width based on field type
  const widthMap: Record<string, number> = {
    'recipient_name': fontSize * 12,
    'certificate_title': fontSize * 15,
    'org_name': fontSize * 10,
    'description': fontSize * 25,
    'issue_date': fontSize * 8,
    'credential_id': fontSize * 10,
    'signature_1': fontSize * 6,
    'signer_1_name': fontSize * 8,
    'signer_1_title': fontSize * 10,
  }
  return widthMap[id] || fontSize * 10
}

function parseDecoShapes(doc: Document, elements: DesignElement[], startCounter: number) {
  let counter = startCounter

  // Parse accent bars, dividers, underlines
  const decoGroups = ['deco_underline', 'deco_accent_bar', 'deco_divider', 'deco_signature_line']
  
  decoGroups.forEach(groupId => {
    const group = doc.getElementById(groupId)
    if (!group) return

    // Check for rect
    const rect = group.getElementsByTagName('rect')[0]
    if (rect) {
      const x = parseFloat(rect.getAttribute('x') || '0')
      const y = parseFloat(rect.getAttribute('y') || '0')
      const width = parseFloat(rect.getAttribute('width') || '100')
      const height = parseFloat(rect.getAttribute('height') || '4')
      const fill = rect.getAttribute('fill') || '#000000'
      const rx = parseFloat(rect.getAttribute('rx') || '0')

      elements.push({
        id: `element-${counter++}`,
        type: 'shape',
        shapeType: 'rect',
        x,
        y,
        width,
        height,
        fill: fill.startsWith('url(') ? '#2563eb' : fill,
        cornerRadius: rx,
      } as ShapeElement)
    }

    // Check for line
    const line = group.getElementsByTagName('line')[0]
    if (line) {
      const x1 = parseFloat(line.getAttribute('x1') || '0')
      const y1 = parseFloat(line.getAttribute('y1') || '0')
      const x2 = parseFloat(line.getAttribute('x2') || '100')
      const y2 = parseFloat(line.getAttribute('y2') || '0')
      const stroke = line.getAttribute('stroke') || '#000000'
      const strokeWidth = parseFloat(line.getAttribute('stroke-width') || '1')

      elements.push({
        id: `element-${counter++}`,
        type: 'shape',
        shapeType: 'line',
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        stroke,
        strokeWidth,
      } as ShapeElement)
    }
  })
}

export async function importTemplatesFromManifest(manifestPath: string): Promise<Array<{ meta: TemplateMeta; design: CertificateDesignV2 }>> {
  const fs = require('fs').promises
  const path = require('path')
  
  const manifestContent = await fs.readFile(manifestPath, 'utf-8')
  const manifest: TemplateMeta[] = JSON.parse(manifestContent)
  
  const templatesDir = path.dirname(manifestPath)
  const results: Array<{ meta: TemplateMeta; design: CertificateDesignV2 }> = []
  
  for (const meta of manifest) {
    const svgPath = path.join(templatesDir, meta.id + '.svg')
    const svgContent = await fs.readFile(svgPath, 'utf-8')
    const design = importSVGTemplate(svgContent, meta)
    results.push({ meta, design })
  }
  
  return results
}
