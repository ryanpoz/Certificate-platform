import type { Background, DesignConfigV3, Element } from '@/lib/design-config/v3-schema'

export type CertificateRenderDataV3 = {
  recipientName: string
  certificateTitle: string
  orgName: string
  issueDate: string
  certificateId: string
  description?: string
  issuerName?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildFieldMap(data: CertificateRenderDataV3): Record<string, string> {
  return {
    recipient_name: data.recipientName,
    course_name: data.certificateTitle,
    certificate_title: data.certificateTitle,
    org_name: data.orgName,
    issue_date: data.issueDate,
    date: data.issueDate,
    certificate_id: data.certificateId,
    credential_id: data.certificateId,
    description: data.description || '',
    custom_1: data.issuerName || data.orgName,
    custom_2: '',
    custom_3: '',
  }
}

function backgroundCss(background: Background): string {
  if (background.type === 'color') {
    return `background-color: ${background.color};`
  }
  if (background.type === 'gradient') {
    const g = background.gradient
    if (g.type === 'linear') {
      const { x1, y1, x2, y2 } = g.coords
      const angleRad = Math.atan2(y2 - y1, x2 - x1)
      const angleDeg = (angleRad * 180) / Math.PI
      const stops = g.stops
        .map(s => `${s.color} ${Math.round(s.offset * 100)}%`)
        .join(', ')
      return `background-image: linear-gradient(${angleDeg}deg, ${stops});`
    }
  }
  if (background.type === 'image') {
    const opacity = background.opacity ?? 1
    return `
      background-color: #ffffff;
      background-image: url('${background.imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `.trim() + (opacity < 1 ? ` /* opacity applied via overlay */ ` : '')
  }
  return 'background-color: #ffffff;'
}

function transformOrigin(originX?: string, originY?: string): string {
  const x = originX === 'center' ? '50%' : originX === 'right' ? '100%' : '0%'
  const y = originY === 'center' ? '50%' : originY === 'bottom' ? '100%' : '0%'
  return `${x} ${y}`
}

function elementBaseStyle(el: {
  x: number
  y: number
  width?: number
  height?: number
  angle?: number
  scaleX?: number
  scaleY?: number
  originX?: string
  originY?: string
  opacity?: number
}): string {
  const width = (el.width || 0) * (el.scaleX || 1)
  const height = (el.height || 0) * (el.scaleY || 1)
  const parts = [
    'position: absolute',
    `left: ${el.x}px`,
    `top: ${el.y}px`,
    width ? `width: ${width}px` : '',
    height ? `height: ${height}px` : '',
    `transform-origin: ${transformOrigin(el.originX, el.originY)}`,
    el.angle ? `transform: rotate(${el.angle}deg)` : '',
    el.opacity !== undefined && el.opacity !== 1 ? `opacity: ${el.opacity}` : '',
  ]
  return parts.filter(Boolean).join('; ')
}

function renderElement(element: Element, fieldMap: Record<string, string>): string {
  if (element.type === 'text') {
    const style = `${elementBaseStyle(element)};
      font-family: '${element.fontFamily}', sans-serif;
      font-size: ${element.fontSize}px;
      font-weight: ${element.fontWeight};
      font-style: ${element.fontStyle};
      color: ${element.fill};
      text-align: ${element.textAlign};
      ${element.underline ? 'text-decoration: underline;' : ''}
      ${element.strikethrough ? 'text-decoration: line-through;' : ''}
      ${element.charSpacing ? `letter-spacing: ${element.charSpacing / 1000}em;` : ''}
      ${element.lineHeight ? `line-height: ${element.lineHeight};` : ''}
      white-space: pre-wrap;`
    return `<div style="${style}">${escapeHtml(element.text)}</div>`
  }

  if (element.type === 'field') {
    const value = fieldMap[element.field] ?? element.placeholder ?? element.field
    const shrink =
      element.autoShrink && value.length > 28
        ? Math.max(element.minFontSize || 12, Math.floor(element.fontSize * 0.7))
        : element.fontSize
    const style = `${elementBaseStyle(element)};
      font-family: '${element.fontFamily}', sans-serif;
      font-size: ${shrink}px;
      font-weight: ${element.fontWeight};
      font-style: ${element.fontStyle};
      color: ${element.fill};
      text-align: ${element.textAlign};
      white-space: pre-wrap;`
    return `<div style="${style}">${escapeHtml(value)}</div>`
  }

  if (element.type === 'shape' && element.shape === 'rect') {
    const style = `${elementBaseStyle(element)};
      background-color: ${element.fill || 'transparent'};
      border: ${element.strokeWidth || 0}px solid ${element.stroke || 'transparent'};
      ${element.rx ? `border-radius: ${element.rx}px;` : ''}`
    return `<div style="${style}"></div>`
  }

  if (element.type === 'shape' && element.shape === 'circle') {
    const r = element.radius || 50
    const style = `${elementBaseStyle({ ...element, width: r * 2, height: r * 2 })};
      background-color: ${element.fill || 'transparent'};
      border: ${element.strokeWidth || 0}px solid ${element.stroke || 'transparent'};
      border-radius: 50%;`
    return `<div style="${style}"></div>`
  }

  if (element.type === 'image') {
    const radius = element.cornerRadius || 0
    const style = `${elementBaseStyle(element)};
      object-fit: ${element.fit || 'contain'};
      ${radius ? `border-radius: ${radius}px;` : ''}`
    return `<img src="${element.imageUrl}" alt="" style="${style}" />`
  }

  return ''
}

/** Inner certificate page markup (no document chrome) for React embeds. */
export function renderCertificateV3Page(
  design: DesignConfigV3,
  data: CertificateRenderDataV3
): string {
  const page = design.pages[0]
  if (!page) throw new Error('Design has no pages')

  const fieldMap = buildFieldMap(data)
  const elementsHTML = page.elements.map(el => renderElement(el, fieldMap)).join('\n')
  const bg = page.background
  const imageOverlay =
    bg.type === 'image' && (bg.opacity ?? 1) < 1
      ? `<div style="position:absolute;inset:0;background:#fff;opacity:${1 - (bg.opacity ?? 1)};pointer-events:none;"></div>`
      : ''

  return `<div style="
    position: relative;
    width: ${page.width}px;
    height: ${page.height}px;
    overflow: hidden;
    ${backgroundCss(bg)}
  ">
    ${imageOverlay}
    ${elementsHTML}
  </div>`
}

/**
 * Render a Design Config V3 certificate to a full HTML document for PDF.
 */
export function renderCertificateV3(
  design: DesignConfigV3,
  data: CertificateRenderDataV3
): string {
  const page = design.pages[0]
  if (!page) throw new Error('Design has no pages')

  const fonts = new Set<string>()
  page.elements.forEach(el => {
    if ((el.type === 'text' || el.type === 'field') && el.fontFamily) {
      fonts.add(el.fontFamily)
    }
  })
  const fontLinks = Array.from(fonts)
    .filter(f => !['Georgia', 'Arial', 'Times New Roman', 'Helvetica'].includes(f))
    .map(
      font =>
        `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap" rel="stylesheet">`
    )
    .join('\n')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  ${fontLinks}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  ${renderCertificateV3Page(design, data)}
</body>
</html>
  `.trim()
}

export function getV3PageSize(design: DesignConfigV3): { width: number; height: number } {
  const page = design.pages[0]
  return { width: page?.width || 1123, height: page?.height || 794 }
}
