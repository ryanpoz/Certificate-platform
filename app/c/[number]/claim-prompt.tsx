'use client'

import { useEffect, useRef, useState } from 'react'
import SharePanel from './share-panel'
import { buildShareLinks, type ShareChannel } from '@/lib/growth/share'
import { tagCertificateUrl } from '@/lib/growth/tracking'
import { celebrationCopy } from '@/lib/growth/celebration'
import { burstConfetti } from '@/lib/growth/confetti'

interface ClaimPromptProps {
  certificateNumber: string
  learnerName: string
  courseName: string
  academyName: string
  certificateUrl: string
  postText: string
  linkedInAddUrl: string
  pdfUrl: string
  /** 'animated' = first view with confetti; 'static' = reduced motion or a later visit */
  variant: 'animated' | 'static'
  onShare: (channel: ShareChannel) => void
  onAddToLinkedIn: () => void
  onDownload: () => void
  onDismiss: () => void
}

/**
 * The recipient's claim moment: a congratulations headline, one big Share on
 * LinkedIn button (the ready-made post), Add to profile, the other share
 * options and the PDF. Celebrates with confetti on the first view only; the
 * parent decides the variant (see lib/growth/celebration.ts).
 */
export default function ClaimPrompt(props: ClaimPromptProps) {
  const { learnerName, courseName, academyName, certificateUrl, linkedInAddUrl, pdfUrl, variant, onShare, onAddToLinkedIn, onDownload, onDismiss } = props
  const [text, setText] = useState(props.postText)
  const [copied, setCopied] = useState(false)
  const fired = useRef(false)
  const animated = variant === 'animated'
  const { headline, subhead } = celebrationCopy(learnerName, courseName)
  const links = buildShareLinks({ certificateUrl, postText: text, courseName, academyName })

  useEffect(() => {
    if (!animated || fired.current) return
    fired.current = true
    // Let the certificate start its reveal, then burst
    let cleanup: (() => void) | null = null
    const timer = window.setTimeout(() => {
      cleanup = burstConfetti({ reducedMotion: false })
    }, 250)
    return () => {
      window.clearTimeout(timer)
      cleanup?.()
    }
  }, [animated])

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text.split(certificateUrl).join(tagCertificateUrl(certificateUrl, 'copy')))
    } catch {
      return
    }
    onShare('copy_text')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      aria-label="Share your certificate"
      data-celebration={variant}
      className="relative mb-6 overflow-hidden rounded-2xl border-2 border-celebrate-glow bg-celebrate-surface text-celebrate-ink shadow-sm"
    >
      <div className="h-1.5 bg-celebrate" aria-hidden="true" />
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className={animated ? 'animate-celebrate-pop motion-reduce:animate-none' : ''}>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-celebrate" aria-hidden="true">
              🎉 Certificate earned
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.02em] sm:text-4xl" role="status">
              {headline}
            </h2>
            <p className="mt-2 text-lg text-ink-soft">{subhead}</p>
            <p className="mt-1 text-sm text-muted">
              Share it with your network. Anyone can verify it with your link.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-full p-1.5 text-muted hover:bg-parchment hover:text-ink"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={links.linkedin_post}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onShare('linkedin_post')}
            data-primary-share
            className="inline-flex h-14 items-center justify-center gap-2.5 rounded-xl bg-[#0a66c2] px-7 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#004182]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Share on LinkedIn
          </a>
          <a
            href={linkedInAddUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onAddToLinkedIn}
            className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-[#0a66c2] bg-white px-5 text-base font-semibold text-[#0a66c2] hover:bg-[#EEF3F8]"
          >
            Add to LinkedIn profile
          </a>
          <a
            href={pdfUrl}
            onClick={onDownload}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-rule-strong bg-white px-5 text-base font-medium text-ink hover:bg-parchment"
          >
            Download PDF
          </a>
        </div>

        <details className="group mt-5">
          <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
            Suggested post <span className="text-muted">(edit before sharing)</span>
          </summary>
          <label htmlFor="share-post-text" className="sr-only">
            Suggested post
          </label>
          <textarea
            id="share-post-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-xl border border-rule-strong bg-white p-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
          <button
            type="button"
            onClick={copyText}
            className="mt-2 inline-flex items-center rounded-full border border-rule-strong bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-parchment"
          >
            {copied ? 'Post copied' : 'Copy post'}
          </button>
        </details>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">More ways to share</p>
          <SharePanel
            certificateUrl={certificateUrl}
            postText={text}
            courseName={courseName}
            academyName={academyName}
            onShare={onShare}
            channels={['x', 'facebook', 'email']}
            compact
          />
        </div>
      </div>
    </section>
  )
}
