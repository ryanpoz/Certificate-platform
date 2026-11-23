'use client'

import { useEffect, useRef } from 'react'

// @ts-ignore
import QRCode from 'qrcode'

export default function QRCodeDisplay({ url, size = 120 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 1,
        color: {
          dark: '#111827',
          light: '#FFFFFF',
        },
      })
    }
  }, [url, size])

  return <canvas ref={canvasRef} aria-label="QR code to verify this certificate" className="rounded-md" />
}
