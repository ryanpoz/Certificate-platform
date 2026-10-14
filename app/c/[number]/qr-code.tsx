'use client'

import { useEffect, useRef } from 'react'

// @ts-ignore
import QRCode from 'qrcode'

export default function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 120,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
    }
  }, [url])

  return <canvas ref={canvasRef} className="border border-gray-200 rounded" />
}
