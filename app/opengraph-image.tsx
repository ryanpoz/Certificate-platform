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
          background: '#17141F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          borderBottom: '18px solid #FFD93D',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '44px' }}>
          <svg width="112" height="112" viewBox="0 0 64 64">
            <rect x="5" y="18" width="40" height="28" rx="5.5" fill="#FFF6EF" />
            <rect x="11.5" y="26.5" width="20" height="2.4" rx="1.2" fill="#17141F" />
            <rect x="11.5" y="32.5" width="13" height="2.4" rx="1.2" fill="#17141F" opacity="0.7" />
            <circle cx="14" cy="39.5" r="2.1" fill="#D1185C" />
            <path fill="#D1185C" d="M49.00,4.50 L51.14,12.83 L58.55,8.45 L54.17,15.86 L62.50,18.00 L54.17,20.14 L58.55,27.55 L51.14,23.17 L49.00,31.50 L46.86,23.17 L39.45,27.55 L43.83,20.14 L35.50,18.00 L43.83,15.86 L39.45,8.45 L46.86,12.83 Z" />
            <circle cx="49" cy="18" r="3.1" fill="#17141F" />
            <circle cx="49" cy="18" r="1.45" fill="#FFF6EF" />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 700, color: '#FFF6EF', marginLeft: '28px' }}>
            {BRAND.name}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 76, fontWeight: 800, color: '#FFF6EF', maxWidth: '980px', lineHeight: 1.0, letterSpacing: '-0.04em' }}>
          <span>Certificates people are&nbsp;</span>
          <span style={{ background: '#FFC44D', color: '#17141F', padding: '0 12px' }}>proud to share.</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
