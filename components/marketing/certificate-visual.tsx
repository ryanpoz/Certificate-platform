import { SamplePill } from '@/components/brand/logo'

/**
 * Hero imagery: an example certificate a learner would be proud to post, and
 * a generic social post where friends react and comment. Built from HTML/SVG;
 * every name, issuer and count is fictional and labelled Example. The post is
 * an inspired feed card: no network logos, and not a copy of any network's UI.
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
  { cls: 'left-[2%] top-[4%] bg-cheer', r: '20deg', delay: '0s' },
  { cls: 'left-[52%] -top-[2%] bg-gold-bright', r: '-30deg', delay: '-1.5s' },
  { cls: 'right-[2%] top-[10%] bg-periwinkle', r: '45deg', delay: '-3s' },
  { cls: '-left-[2%] top-[48%] bg-gold-bright', r: '-15deg', delay: '-2s' },
  { cls: 'right-[0%] top-[46%] bg-mint', r: '30deg', delay: '-4s' },
  { cls: 'left-[8%] bottom-[6%] bg-mint', r: '60deg', delay: '-5s' },
  { cls: 'right-[40%] bottom-[0%] bg-gold-bright', r: '-50deg', delay: '-2.5s' },
  { cls: 'left-[40%] top-[40%] bg-periwinkle', r: '10deg', delay: '-6s' },
]

export const EXAMPLE_CERTIFICATE = {
  issuer: 'Lantern Collective',
  title: 'Breathwork Facilitator Training',
  level: 'Level 1',
  recipient: 'Maya Chen',
  detail: 'for completing 24 hours of live training and passing the practical assessment',
  signer: 'Ama Okafor',
  signerRole: 'Lead trainer',
  issued: '24 October 2026',
  credentialId: 'LC-BFT-0142',
}

/** Round seal with the spark mark; the text ring turns slowly */
function Seal({ className = '' }: { className?: string }) {
  // Caller positions it (absolute); the inner wrapper is the positioning context
  return (
    <div className={className} aria-hidden="true">
      <div className="relative h-full w-full">
      <svg viewBox="0 0 120 120" className="h-full w-full animate-spin-slow motion-reduce:animate-none">
        <defs>
          <path id="seal-ring" d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#FFC44D" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#17141F" strokeWidth="1.5" strokeDasharray="2 3" />
        <text fill="#17141F" fontSize="10.5" fontWeight="700" letterSpacing="2.6" className="font-sans uppercase">
          <textPath href="#seal-ring">Certified · Verified · Certified · Verified ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-[24%] flex items-center justify-center rounded-full bg-cheer shadow-[inset_0_0_0_3px_#FFF6EF]">
        <svg viewBox="35 4 28 28" className="h-[58%] w-[58%] animate-spark-pop motion-reduce:animate-none">
          <path fill="#FFF6EF" d={SPARK} />
          <circle cx="49" cy="18" r="3.1" fill="#D1185C" />
        </svg>
      </div>
      </div>
    </div>
  )
}

/** Small corner ornament: a spark in a rounded tile */
function Corner({ className = '' }: { className?: string }) {
  return (
    <span className={`absolute flex h-6 w-6 items-center justify-center rounded-md bg-ink ${className}`} aria-hidden="true">
      <Spark className="h-3.5 w-3.5 text-gold-bright" />
    </span>
  )
}

export function ExampleCertificate({ className = '' }: { className?: string }) {
  const c = EXAMPLE_CERTIFICATE
  return (
    <article
      aria-label="Example certificate, fictional"
      className={`relative rounded-[22px] bg-ink p-2.5 text-ink shadow-sticker ${className}`}
    >
      {/* Bold graphic frame: sun, mint and cheer bars along the top */}
      <div className="relative overflow-hidden rounded-[16px] bg-[#FFFDF5] px-7 pb-7 pt-7 sm:px-9 sm:pb-6 sm:pt-8">
        <div className="absolute inset-x-0 top-0 flex h-2" aria-hidden="true">
          <span className="flex-[3] bg-sun" />
          <span className="flex-[2] bg-mint" />
          <span className="flex-[1] bg-cheer" />
        </div>
        <div className="pointer-events-none absolute inset-3 rounded-[12px] border-2 border-ink/80" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[18px] rounded-[9px] border border-dashed border-gold/60" aria-hidden="true" />
        <Corner className="left-1.5 top-1.5" />
        <Corner className="right-1.5 top-1.5" />
        <Corner className="bottom-1.5 left-1.5" />
        <Corner className="bottom-1.5 right-1.5" />

        <div className="relative flex flex-wrap items-center gap-x-2.5 gap-y-1 pr-[76px] sm:pr-[108px]">
          <SamplePill className="relative z-10">Example</SamplePill>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">{c.issuer}</span>
        </div>
        <Seal className="absolute right-6 top-6 h-[72px] w-[72px] sm:right-8 sm:top-7 sm:h-[96px] sm:w-[96px]" />

        <div className="relative mt-3 pr-[80px] sm:pr-[108px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold sm:text-[11px]">Certificate of completion · {c.level}</p>
          <p className="mt-1.5 font-display text-[clamp(22px,6.2vw,30px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
            {c.title}
          </p>
        </div>

        <p className="relative mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Proudly presented to</p>
        <p className="relative mt-0.5 inline-block whitespace-nowrap font-display text-[clamp(28px,8vw,40px)] font-extrabold leading-none tracking-[-0.045em]">
          <span className="relative z-10">{c.recipient}</span>
          <span className="absolute inset-x-[-4px] bottom-[2px] z-0 h-[0.32em] rounded-sm bg-gold-bright/80" aria-hidden="true" />
        </p>
        <p className="relative mt-2 max-w-[30em] text-[12px] leading-snug text-ink-soft sm:text-[13px]">{c.detail}.</p>

        <div className="relative mt-4 grid grid-cols-[1fr_auto] items-end gap-3 border-t border-ink/15 pt-3.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-tight sm:grid-cols-3">
            <div>
              <div className="font-display text-[15px] font-bold italic tracking-[-0.02em] text-ink">{c.signer}</div>
              <div className="text-muted">{c.signerRole}</div>
            </div>
            <div>
              <div className="text-muted">Issued</div>
              <div className="font-semibold text-ink">{c.issued}</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-muted">Credential ID</div>
              <div className="font-mono font-semibold text-ink">{c.credentialId}</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <QrSample className="h-12 w-12 ring-1 ring-ink/15" />
            <span className="flex items-center gap-1 rounded-full bg-teal-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-teal">
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                <path d="M2.5 6.2l2.2 2.2 4.8-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verify
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

/** Reaction icons: thumbs-up, clapping celebrate and heart, in brand colours */
function Reactions() {
  const base = 'flex h-[22px] w-[22px] items-center justify-center rounded-full ring-2 ring-white'
  return (
    <span className="flex -space-x-1.5" aria-hidden="true">
      <span className={`${base} bg-periwinkle`}>
        <svg viewBox="0 0 16 16" className="h-3 w-3">
          <path fill="#fff" d="M6.5 7V3.6c0-.9.6-1.6 1.4-1.6.4 0 .7.3.7.7V6h3.6c.9 0 1.5.8 1.3 1.6l-.9 4.3c-.2.7-.8 1.1-1.5 1.1H6.5V7zM2.5 7h2.5v6H2.5z" />
        </svg>
      </span>
      <span className={`${base} bg-gold-bright`}>
        <svg viewBox="35 4 28 28" className="h-3 w-3">
          <path fill="#17141F" d={SPARK} />
        </svg>
      </span>
      <span className={`${base} bg-cheer`}>
        <svg viewBox="0 0 16 16" className="h-3 w-3">
          <path fill="#fff" d="M8 13.5S2 10 2 6.2C2 4.4 3.4 3 5.1 3c1.2 0 2.2.6 2.9 1.6C8.7 3.6 9.7 3 10.9 3 12.6 3 14 4.4 14 6.2 14 10 8 13.5 8 13.5z" />
        </svg>
      </span>
    </span>
  )
}

const COMMENTS = [
  { initials: 'PS', name: 'Priya Shah', avatar: 'bg-sun text-ink', text: 'Congratulations, Maya! So well deserved.' },
  { initials: 'DR', name: 'Dan Ruiz', avatar: 'bg-mint text-ink', text: 'Your sessions are going to be wonderful. Count me in for the first one.' },
  { initials: 'TB', name: 'Tess Bauer', avatar: 'bg-ink text-cream', text: 'This looks amazing. I want to take this course too. Where do I sign up?', lead: true },
]

export function ExamplePost({ className = '' }: { className?: string }) {
  const c = EXAMPLE_CERTIFICATE
  return (
    <article aria-label="Example post, fictional" className={`relative rounded-[20px] bg-white p-4 text-ink shadow-sticker ${className}`}>
      <SamplePill className="absolute -top-2.5 right-4">Example post</SamplePill>
      <header className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-white" aria-hidden="true">
          MC
        </div>
        <div className="min-w-0 leading-tight">
          <strong className="block text-sm">{c.recipient}</strong>
          <span className="text-xs text-muted">Breathwork facilitator · 2h</span>
        </div>
      </header>
      <p className="mt-2.5 text-[13.5px] leading-[1.5] text-ink-soft">
        Six weekends of live practice, one practical assessment, and I&apos;m officially a certified breathwork facilitator. Thank you, {c.issuer}!
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Reactions />
          <span>Priya Shah and 47 others</span>
        </span>
        <span>12 comments</span>
      </div>
      <div className="mt-2 flex justify-between border-y border-rule py-1.5 text-xs font-semibold text-ink-soft" aria-hidden="true">
        <span>React</span>
        <span>Comment</span>
        <span>Repost</span>
        <span>Send</span>
      </div>

      <ul className="mt-3 space-y-2.5" aria-label="Example comments">
        {COMMENTS.map((cm, i) => (
          <li
            key={cm.initials}
            className="flex animate-rise-in items-start gap-2 motion-reduce:animate-none"
            style={{ animationDelay: `${700 + i * 350}ms` }}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${cm.avatar}`} aria-hidden="true">
              {cm.initials}
            </span>
            <div className={`min-w-0 rounded-xl px-3 py-1.5 text-[12.5px] leading-snug ${cm.lead ? 'bg-cheer-soft' : 'bg-page'}`}>
              <strong className="block text-[12px] text-ink">{cm.name}</strong>
              <span className="text-ink-soft">{cm.text}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}

/** Hero stage: the certificate up front, and the post where people engage with it */
export function ShareStage() {
  return (
    <div className="relative mx-auto w-full max-w-[580px] pb-2 pt-3">
      <div aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`absolute z-0 h-[5px] w-[14px] rounded-full ${c.cls} animate-drift motion-reduce:animate-none`}
            style={{ ['--r' as string]: c.r, transform: `rotate(${c.r})`, animationDelay: c.delay }}
          />
        ))}
      </div>
      {/* Tilt lives on the wrapper so the entrance animation doesn't undo it */}
      <div className="relative z-10 -rotate-[2deg]">
        <ExampleCertificate className="animate-cert-reveal motion-reduce:animate-none" />
      </div>
      <div className="relative z-20 -mt-4 ml-3 rotate-[1.5deg] sm:-mt-5 sm:ml-[24%] sm:-mr-[3%]">
        <ExamplePost className="animate-rise-in motion-reduce:animate-none" />
      </div>
    </div>
  )
}
