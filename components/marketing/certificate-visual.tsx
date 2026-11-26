/**
 * Sample certificate and verification slip for marketing pages. Built from
 * HTML/SVG; the content is fictional and labelled Sample.
 */

export function QrSample({ className = '' }: { className?: string }) {
  const cells = [
    [23, 3, 4, 4], [23, 11, 4, 4], [27, 7, 4, 4], [23, 23, 6, 6], [33, 23, 4, 4], [41, 23, 4, 4], [37, 27, 4, 4],
    [45, 27, 4, 4], [33, 33, 6, 6], [23, 33, 4, 4], [23, 41, 4, 4], [27, 45, 4, 4], [41, 37, 4, 4], [45, 41, 4, 4],
    [33, 45, 4, 4], [41, 45, 8, 4], [13, 23, 4, 4], [3, 23, 4, 4], [7, 27, 4, 4],
  ]
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="16" height="16" fill="#1C1917" />
      <rect x={x + 2.5} y={y + 2.5} width="11" height="11" fill="#FFFDF9" />
      <rect x={x + 5} y={y + 5} width="6" height="6" fill="#1C1917" />
    </g>
  )
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" className={`border border-ink bg-cream p-[3px] ${className}`}>
      <rect width="52" height="52" fill="#FFFDF9" />
      {finder(3, 3)}
      {finder(33, 3)}
      {finder(3, 33)}
      <g fill="#1C1917">
        {cells.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}

export function ValidPill() {
  return (
    <span className="valid-pill">
      <span className="h-1.5 w-1.5 rounded-full bg-valid" aria-hidden="true" /> Valid
    </span>
  )
}

export function CertificateVisual() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[540px] sm:h-[480px]" aria-label="Sample certificate and verification slip">
      <div className="absolute left-0 top-4 w-[92%] origin-[50%_60%] -rotate-[4.5deg] border-[1.5px] border-ink bg-cream p-[18px] shadow-paper sm:w-[500px]">
        <div className="flex h-[320px] flex-col border border-ink px-6 pb-4 pt-5">
          <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">
            <span>Harbour Skills Institute</span>
            <span>Sample</span>
          </div>
          <div className="mb-1 text-center font-display text-[13px] font-medium italic text-brass">This is to certify that</div>
          <div className="mx-6 mb-2.5 truncate border-b border-rule-strong pb-1.5 text-center font-display text-[36px] font-medium leading-none tracking-[-0.03em]">
            Jordan Lee
          </div>
          <div className="mb-3 text-center font-display text-[20px] font-semibold tracking-[-0.02em]">Occupational First Aid — Level 2</div>
          <p className="mx-auto mb-4 max-w-[340px] text-center text-[12.5px] leading-[1.45] text-ink-soft">
            has completed the required training and assessment, and is entitled to hold this credential for the period shown below.
          </p>
          <div className="mt-auto grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <div className="inline-block min-w-[110px] border-t border-ink pt-1 font-display text-base font-medium italic">A. Rahman</div>
              <div className="mt-0.5 text-[10px] text-muted">Registrar</div>
            </div>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-stamp text-center text-[8px] font-semibold uppercase leading-[1.2] tracking-[0.12em] text-cream"
              style={{ boxShadow: 'inset 0 0 0 5px #8E1B1B, inset 0 0 0 6.2px #FFFDF9' }}
            >
              Official
              <br />
              seal
            </div>
            <div className="text-right text-[10px] leading-normal text-ink-soft">
              Issued 18 Mar 2025
              <strong className="block text-[11px] font-semibold text-stamp">Valid until 18 Mar 2027</strong>
            </div>
          </div>
        </div>
      </div>
      <aside
        className="absolute bottom-2 right-2 z-[2] w-[228px] rotate-[5deg] border border-ink bg-paper p-3.5 pb-3 shadow-paper"
        aria-label="Sample verification slip"
      >
        <div className="mb-2.5 flex items-center justify-between">
          <ValidPill />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Sample</span>
        </div>
        <div className="flex items-start gap-2.5">
          <QrSample className="h-[52px] w-[52px] shrink-0" />
          <div>
            <div className="mb-0.5 text-[13px] font-semibold">Jordan Lee</div>
            <p className="text-[11px] leading-[1.4] text-ink-soft">Occupational First Aid — Level 2, Harbour Skills Institute.</p>
          </div>
        </div>
        <div className="mt-2.5 flex justify-between gap-2 border-t border-rule pt-2 text-[10px] text-muted">
          <div>
            Expires<strong className="block font-semibold text-ink">18 Mar 2027</strong>
          </div>
          <div>
            ID<strong className="block font-semibold text-ink">HSI-2026-0841</strong>
          </div>
        </div>
      </aside>
    </div>
  )
}
