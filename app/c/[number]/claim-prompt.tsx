'use client'

import { useEffect, useState } from 'react'
import SharePanel from './share-panel'
import { firstName, type ShareChannel } from '@/lib/growth/share'

interface ClaimPromptProps {
  certificateNumber: string
  learnerName: string
  courseName: string
  academyName: string
  certificateUrl: string
  postText: string
  linkedInAddUrl: string
  onShare: (channel: ShareChannel) => void
  onAddToLinkedIn: () => void
}

/**
 * Shown to the recipient when they open their certificate from the issue email:
 * a ready-to-post LinkedIn message plus one-click share links.
 */
export default function ClaimPrompt(props: ClaimPromptProps) {
  const { certificateNumber, learnerName, courseName, academyName, certificateUrl, linkedInAddUrl, onShare, onAddToLinkedIn } = props
  const storageKey = `claim-prompt-dismissed:${certificateNumber}`
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState(props.postText)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey) !== '1')
    } catch {
      setVisible(true)
    }
  }, [storageKey])

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      // ignore storage errors
    }
    setVisible(false)
  }

  async function copyText() {
    await navigator.clipboard.writeText(text)
    onShare('copy_text')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!visible) return null

  return (
    <section
      aria-label="Share your certificate"
      className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Congratulations, {firstName(learnerName)}!</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">
              Your {courseName} certificate is ready to share
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Add it to your LinkedIn profile and let your network know. Anyone can verify it with your link.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label htmlFor="share-post-text" className="mt-5 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Suggested post
        </label>
        <textarea
          id="share-post-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={linkedInAddUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onAddToLinkedIn}
            className="inline-flex items-center gap-2 rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004182]"
          >
            Add to LinkedIn profile
          </a>
          <button
            type="button"
            onClick={copyText}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? 'Post copied' : 'Copy post'}
          </button>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Share to</p>
          <SharePanel
            certificateUrl={certificateUrl}
            postText={text}
            courseName={courseName}
            academyName={academyName}
            onShare={onShare}
            compact
          />
        </div>
      </div>
    </section>
  )
}
