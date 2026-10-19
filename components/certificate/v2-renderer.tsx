'use client'

import { useEffect, useState } from 'react'
import { type CertificateDesignV2 } from '@/lib/certificate-builder/design-v2'
import QRCode from 'qrcode'

interface V2RendererProps {
  design: CertificateDesignV2
  data: {
    recipientName: string
    certificateTitle: string
    orgName: string
    issueDate: string
    certificateId: string
    description: string
  }
  certificateUrl: string
}

export default function V2CertificateRenderer({ design, data, certificateUrl }: V2RendererProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [fonts, setFonts] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(certificateUrl, { width: 256, margin: 1 })
      .then(setQrDataUrl)
      .catch(console.error)

    // Collect fonts
    const fontSet = new Set<string>()
    design.elements.forEach(el => {
      if ((el.type === 'text' || el.type === 'dynamic-field' || el.type === 'signature') && (el as any).fontFamily) {
        fontSet.add((el as any).fontFamily)
      }
    })
    setFonts(fontSet)
  }, [design, certificateUrl])

  // Load Google Fonts
  useEffect(() => {
    if (fonts.size === 0) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    const fontFamilies = Array.from(fonts).map(f => f.replace(/ /g, '+')).join('&family=')
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@400;700&display=swap`
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [fonts])

  const fieldMap: Record<string, string> = {
    recipient_name: data.recipientName,
    certificate_title: data.certificateTitle,
    org_name: data.orgName,
    date: data.issueDate,
    issue_date: data.issueDate,
    certificate_id: data.certificateId,
    credential_id: data.certificateId,
    description: data.description,
    signature_1: 'Signature',
    signer_1_name: 'Signer Name',
    signer_1_title: 'Title',
    org_tagline: '',
  }

  const backgroundStyle =
    design.background.type === 'color'
      ? { backgroundColor: design.background.value }
      : design.background.type === 'image'
      ? {
          backgroundImage: `url('${design.background.value}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { background: design.background.value }

  return (
    <div
      className="relative mx-auto shadow-2xl"
      style={{
        width: `${design.width}px`,
        height: `${design.height}px`,
        maxWidth: '100%',
        ...backgroundStyle,
      }}
    >
      {design.elements.map((element) => {
        const baseStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width}px`,
          height: `${element.height}px`,
          transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        }

        if (element.type === 'text') {
          const el = element as any
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                fontFamily: `'${el.fontFamily}', sans-serif`,
                fontSize: `${el.fontSize}px`,
                fontWeight: el.fontWeight,
                color: el.color,
                textAlign: el.align,
                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                lineHeight: el.lineHeight,
              }}
            >
              {el.text}
            </div>
          )
        }

        if (element.type === 'dynamic-field') {
          const el = element as any
          const value = fieldMap[el.field] || el.field
          const autoShrinkStyle =
            el.autoShrink && value.length > 30
              ? { fontSize: `${Math.max(el.fontSize * 0.7, 16)}px` }
              : {}

          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                fontFamily: `'${el.fontFamily}', sans-serif`,
                fontSize: `${el.fontSize}px`,
                fontWeight: el.fontWeight,
                color: el.color,
                textAlign: el.align,
                ...autoShrinkStyle,
              }}
            >
              {value}
            </div>
          )
        }

        if (element.type === 'shape') {
          const el = element as any
          if (el.shapeType === 'rect' || el.shapeType === 'border' || el.shapeType === 'frame') {
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  backgroundColor: el.fill || 'transparent',
                  border: el.stroke ? `${el.strokeWidth || 0}px solid ${el.stroke}` : undefined,
                  borderRadius: el.cornerRadius ? `${el.cornerRadius}px` : undefined,
                }}
              />
            )
          } else if (el.shapeType === 'circle') {
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  backgroundColor: el.fill || 'transparent',
                  border: el.stroke ? `${el.strokeWidth || 0}px solid ${el.stroke}` : undefined,
                  borderRadius: '50%',
                }}
              />
            )
          } else if (el.shapeType === 'line') {
            return (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${Math.abs(element.width)}px`,
                  height: `${el.strokeWidth || 2}px`,
                  backgroundColor: el.stroke || '#000000',
                }}
              />
            )
          }
        }

        if (element.type === 'image') {
          const el = element as any
          return (
            <img
              key={element.id}
              src={el.src}
              alt=""
              style={{
                ...baseStyle,
                objectFit: 'contain',
                opacity: el.opacity,
              }}
            />
          )
        }

        if (element.type === 'signature') {
          const el = element as any
          if (el.signatureType === 'image' && el.src) {
            return (
              <div key={element.id} style={baseStyle}>
                <img
                  src={el.src}
                  alt="Signature"
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                />
                {el.title && (
                  <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: '#666' }}>
                    {el.title}
                  </div>
                )}
              </div>
            )
          } else if (el.signatureType === 'text' && el.text) {
            return (
              <div key={element.id} style={baseStyle}>
                <div
                  style={{
                    fontFamily: `'${el.fontFamily || 'Allura'}', cursive`,
                    fontSize: `${el.fontSize || 32}px`,
                    color: el.color || '#000',
                    textAlign: 'center',
                  }}
                >
                  {el.text}
                </div>
                {el.title && (
                  <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: '#666' }}>
                    {el.title}
                  </div>
                )}
              </div>
            )
          }
        }

        if (element.type === 'qr-code' && qrDataUrl) {
          return (
            <div key={element.id} style={baseStyle}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              {(element as any).showLink && (
                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '10px',
                    color: '#666',
                    textAlign: 'center',
                    wordBreak: 'break-all',
                  }}
                >
                  {certificateUrl}
                </div>
              )}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
