/**
 * Tiny dependency-free confetti burst on a throwaway canvas (~1 KB minified).
 * Colours come from CSS custom properties (--confetti-1 … --confetti-5) so a
 * rebrand only touches the theme tokens, never this file.
 */

export const CONFETTI_COLOR_VARS = ['--confetti-1', '--confetti-2', '--confetti-3', '--confetti-4', '--confetti-5'] as const

/** Used only if the theme tokens are missing */
const FALLBACK_COLORS = ['#8E1B1B', '#C9A45C', '#1F5C45', '#1C1917', '#E4DCD0']

export function readConfettiColors(
  getVar: (name: string) => string | null | undefined,
): string[] {
  const colors = CONFETTI_COLOR_VARS.map((name) => (getVar(name) || '').trim()).filter(Boolean)
  return colors.length ? colors : FALLBACK_COLORS
}

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  color: string
}

export function makePieces(count: number, width: number, height: number, colors: string[], random = Math.random): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (random() - 0.5) * 1.6
    const speed = 7 + random() * 9
    return {
      x: width / 2 + (random() - 0.5) * width * 0.25,
      y: height * 0.35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + random() * 6,
      rotation: random() * Math.PI,
      spin: (random() - 0.5) * 0.3,
      color: colors[i % colors.length],
    }
  })
}

/**
 * Fire one burst. Returns a cleanup function, or null when nothing was drawn
 * (reduced motion, no DOM, or no canvas support).
 */
export function burstConfetti(opts: { reducedMotion: boolean; count?: number; durationMs?: number }): (() => void) | null {
  if (opts.reducedMotion) return null
  if (typeof window === 'undefined' || typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60'
  ctx.scale(dpr, dpr)
  document.body.appendChild(canvas)

  const styles = getComputedStyle(document.documentElement)
  const pieces = makePieces(opts.count ?? 140, width, height, readConfettiColors((n) => styles.getPropertyValue(n)))
  const duration = opts.durationMs ?? 2600
  const start = performance.now()
  let frame = 0

  const tick = (now: number) => {
    const t = now - start
    ctx.clearRect(0, 0, width, height)
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - duration * 0.6) / (duration * 0.4))
    for (const p of pieces) {
      p.vy += 0.28
      p.vx *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.spin
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }
    if (t < duration) frame = requestAnimationFrame(tick)
    else cleanup()
  }

  const cleanup = () => {
    cancelAnimationFrame(frame)
    canvas.remove()
  }

  frame = requestAnimationFrame(tick)
  return cleanup
}
