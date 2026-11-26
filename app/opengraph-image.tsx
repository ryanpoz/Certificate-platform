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
          background: '#F4EFE6',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          borderTop: '14px solid #8E1B1B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <svg width="112" height="112" viewBox="0 0 64 64">
            <rect x="5" y="13" width="40" height="28" rx="3.25" fill="#1C1917" />
            <rect x="11" y="22.5" width="22" height="2.1" rx="1.05" fill="#F4EFE6" />
            <rect x="11" y="28.5" width="14" height="2.1" rx="1.05" fill="#F4EFE6" opacity="0.72" />
            <circle cx="46" cy="45" r="14" fill="#8E1B1B" />
            <circle cx="46" cy="45" r="10.6" fill="none" stroke="#F4EFE6" strokeWidth="1.35" />
            <rect x="40.2" y="40.4" width="11.6" height="7.4" rx="1.05" fill="#F4EFE6" />
            <rect x="42" y="42.3" width="6.4" height="1.15" rx="0.5" fill="#8E1B1B" />
            <rect x="42" y="44.7" width="4.2" height="1.15" rx="0.5" fill="#8E1B1B" />
          </svg>
          <div style={{ fontSize: 72, fontWeight: 600, color: '#1C1917', marginLeft: '28px', fontFamily: 'serif' }}>
            {BRAND.name}
          </div>
        </div>
        <div style={{ fontSize: 40, color: '#44403C', maxWidth: '900px', lineHeight: 1.25, fontFamily: 'serif' }}>
          {BRAND.tagline}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
