'use client'

import { useMemo } from 'react'
import type { DesignConfigV3 } from '@/lib/design-config/v3-schema'
import {
  renderCertificateV3Page,
  getV3PageSize,
  type CertificateRenderDataV3,
} from '@/lib/certificate-builder/render-v3'

interface V3RendererProps {
  design: DesignConfigV3
  data: CertificateRenderDataV3
  maxWidth?: number
}

/**
 * Client preview of a Design Config V3 certificate using the shared HTML renderer.
 */
export default function V3CertificateRenderer({
  design,
  data,
  maxWidth = 720,
}: V3RendererProps) {
  const { width, height } = getV3PageSize(design)
  const html = useMemo(() => renderCertificateV3Page(design, data), [design, data])
  const scale = Math.min(1, maxWidth / width)

  return (
    <div
      className="mx-auto overflow-hidden shadow-md bg-white"
      style={{
        width: width * scale,
        height: height * scale,
      }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
