import { ImageResponse } from 'next/og'
import { BRAND } from '@/lib/config/brand'

export const runtime = 'edge'

export const alt = BRAND.tagline
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #dbeafe, #ffffff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          {BRAND.name}
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#4b5563',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {BRAND.tagline}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
