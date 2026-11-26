import { SamplePill } from '@/components/brand/logo'

/**
 * Hero imagery: a fictional learner's certificate and a generic share post,
 * sitting like stickers on the ink poster. Built from HTML/SVG; everything is
 * fictional and labelled Sample. The post is a generic feed card, not a copy of
 * any network's UI.
 */

const SPARK =
  'M49.00,4.50 L51.14,12.83 L58.55,8.45 L54.17,15.86 L62.50,18.00 L54.17,20.14 L58.55,27.55 L51.14,23.17 L49.00,31.50 L46.86,23.17 L39.45,27.55 L43.83,20.14 L35.50,18.00 L43.83,15.86 L39.45,8.45 L46.86,12.83 Z'

export function Spark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="35 4 28 28" aria-hidden="true" className={className}>
      <path fill="currentColor" d={SPARK} />
    </svg>
  )
}

export function QrSample({ className = '' }: { className?: string }) {
  const cells = [
    [23, 3, 4, 4], [23, 11, 4, 4], [27, 7, 4, 4], [23, 23, 6, 6], [33, 23, 4, 4], [41, 23, 4, 4], [37, 27, 4, 4],
    [45, 27, 4, 4], [33, 33, 6, 6], [23, 33, 4, 4], [23, 41, 4, 4], [27, 45, 4, 4], [41, 37, 4, 4], [45, 41, 4, 4],
    [33, 45, 4, 4], [41, 45, 8, 4], [13, 23, 4, 4], [3, 23, 4, 4], [7, 27, 4, 4],
  ]
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="16" height="16" rx="2" fill="#17141F" />
      <rect x={x + 2.5} y={y + 2.5} width="11" height="11" rx="1" fill="#FFFFFF" />
      <rect x={x + 5} y={y + 5} width="6" height="6" rx="1" fill="#17141F" />
    </g>
  )
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" className={`rounded-md bg-white ${className}`}>
      <rect width="52" height="52" fill="#FFFFFF" />
      {finder(3, 3)}
      {finder(33, 3)}
      {finder(3, 33)}
      <g fill="#17141F">
        {cells.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}

/** Decorative confetti ticks; drift slowly, static with reduced motion */
const CONFETTI = [
  { cls: 'left-[4%] top-[6%] bg-cheer', r: '20deg', delay: '0s' },
  { cls: 'left-[46%] top-[1%] bg-gold-bright', r: '-30deg', delay: '-1.5s' },
  { cls: 'right-[6%] top-[14%] bg-periwinkle', r: '45deg', delay: '-3s' },
  { cls: 'left-[1%] top-[52%] bg-gold-bright', r: '-15deg', delay: '-2s' },
  { cls: 'right-[2%] top-[58%] bg-cheer', r: '30deg', delay: '-4s' },
  { cls: 'left-[30%] bottom-[2%] bg-mint', r: '60deg', delay: '-5s' },
  { cls: 'right-[24%] bottom-[0%] bg-gold-bright', r: '-50deg', delay: '-2.5s' },
  { cls: 'left-[58%] top-[44%] bg-periwinkle', r: '10deg', delay: '-6s' },
]

export function ShareStage() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[500px] sm:h-[460px]">
      <div aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`absolute h-[5px] w-[14px] rounded-full ${c.cls} animate-drift motion-reduce:animate-none`}
            style={{ ['--r' as string]: c.r, transform: `rotate(${c.r})`, animationDelay: c.delay }}
          />
        ))}
      </div>

      {/* Generic share post, behind and up-right: "they posted it" */}
      <article
        aria-label="Sample share post, fictional"
        className="absolute right-0 top-0 w-[290px] rotate-[3deg] rounded-[20px] bg-white p-4 text-ink shadow-sticker animate-rise-in motion-reduce:animate-none sm:w-[310px]"
      >
        <SamplePill className="absolute -top-2.5 right-4">Sample post</SamplePill>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-white" aria-hidden="true">
            MC
          </div>
          <div className="leading-tight">
            <strong className="block text-sm">Maya Chen</strong>
            <span className="text-xs text-muted">Shared a certificate</span>
          </div>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.5] text-ink-soft">
          Just wrapped Facilitation Fundamentals with Lantern Collective. Grateful for the weekend, and proud to have this one to show for it.
        </p>
        <div className="mt-3 rounded-xl border border-rule bg-page px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-cheer">Lantern Collective</div>
          <div className="font-display text-[15px] font-bold tracking-[-0.02em]">Facilitation Fundamentals</div>
          <div className="text-xs text-muted">Awarded to Maya Chen</div>
        </div>
        <div className="mt-3 flex justify-between border-t border-rule pt-2.5 text-xs font-semibold text-muted" aria-hidden="true">
          <span>Appreciate</span>
          <span>Comment</span>
          <span>Send</span>
        </div>
      </article>

      {/* The certificate, in front */}
      <article
        aria-label="Sample certificate, fictional"
        className="absolute bottom-0 left-0 w-[300px] -rotate-[2.5deg] overflow-hidden rounded-[20px] bg-white text-ink shadow-sticker sm:w-[320px]"
      >
        <div className="relative m-2.5 overflow-hidden rounded-[14px] border border-rule bg-[#FFFDF5] px-5 pb-4 pt-5">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-cheer" aria-hidden="true" />
          <SamplePill className="absolute left-5 top-3">Sample</SamplePill>
          <Spark className="absolute right-3 top-3 h-9 w-9 text-cheer" />
          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Lantern Collective</div>
          <div className="mt-1 font-display text-[24px] font-extrabold leading-[1.02] tracking-[-0.035em]">
            Facilitation
            <br />
            Fundamentals
          </div>
          <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Awarded to</div>
          <div className="whitespace-nowrap font-display text-[22px] font-bold tracking-[-0.03em]">Maya Chen</div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-[11px] leading-snug text-muted">
              Completed
              <br />
              <strong className="text-ink">24 October 2026</strong>
            </div>
            <QrSample className="h-11 w-11" />
          </div>
        </div>
        <div className="px-2.5 pb-2.5">
          <span className="flex h-10 w-full items-center justify-center rounded-btn bg-ink text-sm font-semibold text-white" aria-hidden="true">
            Share to LinkedIn
          </span>
        </div>
      </article>
    </div>
  )
}
