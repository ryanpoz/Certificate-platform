import { type CertificateDesignV2, getSampleData } from './design-v2'

/**
 * Render a v2 certificate design to HTML for PDF generation and public display
 */
export function renderCertificateV2(
  design: CertificateDesignV2,
  data: {
    recipientName: string
    certificateTitle: string
    orgName: string
    issueDate: string
    certificateId: string
    description?: string
  }
): string {
  const fieldMap: Record<string, string> = {
    recipient_name: data.recipientName,
    certificate_title: data.certificateTitle,
    org_name: data.orgName,
    date: data.issueDate,
    certificate_id: data.certificateId,
    description: data.description || '',
  }

  let elementsHTML = ''

  // Render elements in z-index order
  const sortedElements = [...design.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  sortedElements.forEach(element => {
    const baseStyles = `
      position: absolute;
      left: ${element.x}px;
      top: ${element.y}px;
      width: ${element.width}px;
      height: ${element.height}px;
      ${element.rotation ? `transform: rotate(${element.rotation}deg);` : ''}
    `

    if (element.type === 'text') {
      const el = element as any
      elementsHTML += `
        <div style="${baseStyles}
          font-family: '${el.fontFamily}', sans-serif;
          font-size: ${el.fontSize}px;
          font-weight: ${el.fontWeight};
          color: ${el.color};
          text-align: ${el.align};
          ${el.letterSpacing ? `letter-spacing: ${el.letterSpacing}px;` : ''}
          ${el.lineHeight ? `line-height: ${el.lineHeight};` : ''}
        ">${el.text}</div>
      `
    }

    if (element.type === 'dynamic-field') {
      const el = element as any
      const value = fieldMap[el.field as string] || el.field
      const autoShrinkStyle = el.autoShrink && value.length > 30
        ? `font-size: ${Math.max(el.fontSize * 0.7, 16)}px;`
        : ''
      
      elementsHTML += `
        <div style="${baseStyles}
          font-family: '${el.fontFamily}', sans-serif;
          font-size: ${el.fontSize}px;
          font-weight: ${el.fontWeight};
          color: ${el.color};
          text-align: ${el.align};
          ${autoShrinkStyle}
          ${el.letterSpacing ? `letter-spacing: ${el.letterSpacing}px;` : ''}
          ${el.lineHeight ? `line-height: ${el.lineHeight};` : ''}
        ">${value}</div>
      `
    }

    if (element.type === 'shape') {
      const el = element as any
      if (el.shapeType === 'rect' || el.shapeType === 'border') {
        elementsHTML += `
          <div style="${baseStyles}
            background-color: ${el.fill || 'transparent'};
            border: ${el.strokeWidth || 0}px solid ${el.stroke || 'transparent'};
            ${el.cornerRadius ? `border-radius: ${el.cornerRadius}px;` : ''}
          "></div>
        `
      } else if (el.shapeType === 'circle') {
        elementsHTML += `
          <div style="${baseStyles}
            background-color: ${el.fill || 'transparent'};
            border: ${el.strokeWidth || 0}px solid ${el.stroke || 'transparent'};
            border-radius: 50%;
          "></div>
        `
      }
    }

    if (element.type === 'image') {
      const el = element as any
      elementsHTML += `
        <img src="${el.src}" style="${baseStyles}
          object-fit: contain;
          ${el.opacity ? `opacity: ${el.opacity};` : ''}
        " />
      `
    }

    if (element.type === 'signature') {
      const el = element as any
      if (el.signatureType === 'image' && el.src) {
        elementsHTML += `
          <div style="${baseStyles}">
            <img src="${el.src}" style="width: 100%; height: auto; object-fit: contain;" />
            ${el.title ? `<div style="text-align: center; font-size: 12px; margin-top: 4px; color: #666;">${el.title}</div>` : ''}
          </div>
        `
      } else if (el.signatureType === 'text' && el.text) {
        elementsHTML += `
          <div style="${baseStyles}">
            <div style="font-family: '${el.fontFamily || 'Allura'}', cursive; font-size: ${el.fontSize || 32}px; color: ${el.color || '#000'}; text-align: center;">${el.text}</div>
            ${el.title ? `<div style="text-align: center; font-size: 12px; margin-top: 4px; color: #666;">${el.title}</div>` : ''}
          </div>
        `
      }
    }

    if (element.type === 'qr-code') {
      // QR code will be generated separately in the actual rendering
      elementsHTML += `
        <div style="${baseStyles}
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #666;
        ">QR Code</div>
      `
    }
  })

  // Load Google Fonts
  const fonts = new Set<string>()
  design.elements.forEach(el => {
    if ((el.type === 'text' || el.type === 'dynamic-field' || el.type === 'signature') && (el as any).fontFamily) {
      fonts.add((el as any).fontFamily)
    }
  })

  const fontLinks = Array.from(fonts)
    .map(font => `<link href="https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700&display=swap" rel="stylesheet">`)
    .join('\n')

  const backgroundStyle = design.background.type === 'color'
    ? `background-color: ${design.background.value};`
    : design.background.type === 'image'
    ? `background-image: url('${design.background.value}'); background-size: cover; background-position: center;`
    : `background: ${design.background.value};`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  ${fontLinks}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div style="
    position: relative;
    width: ${design.width}px;
    height: ${design.height}px;
    ${backgroundStyle}
    ${design.background.opacity ? `opacity: ${design.background.opacity};` : ''}
  ">
    ${elementsHTML}
  </div>
</body>
</html>
  `.trim()
}
