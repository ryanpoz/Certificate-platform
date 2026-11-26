'use client'

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/config/brand'
import { formatDate, renderMergeFields } from '@/lib/utils/helpers'
import { generateLinkedInUrl } from '@/lib/email/resend'
import QRCodeDisplay from './qr-code'
import SharePanel from './share-panel'
import ClaimPrompt from './claim-prompt'
import VerifiedByFooter from './verified-by-footer'
import { buildSharePostText, shortVerifyLink, type ShareChannel } from '@/lib/growth/share'
import { tagCertificateUrl, signupRefUrl } from '@/lib/growth/tracking'
import {
  celebrationStyle,
  markCelebrated,
  markPromptDismissed,
  prefersReducedMotion,
  resolveClaimMode,
  resolveIsRecipient,
  stripRecipientParam,
  type ClaimMode,
} from '@/lib/growth/celebration'
import { type CertificateDesignV2 } from '@/lib/certificate-builder/design-v2'
import type { DesignConfigV3 } from '@/lib/design-config/v3-schema'
import V2CertificateRenderer from '@/components/certificate/v2-renderer'
import V3CertificateRenderer from '@/components/certificate/v3-renderer'

interface CertificateViewProps {
  certificate: {
    number: string
    issueDate: Date
    expiryDate: Date | null
    status: 'valid' | 'expired' | 'revoked'
    revokedAt: Date | null
    revokeReason: string | null
    custom: Record<string, any>
    isPreview: boolean
  }
  learner: {
    fullName: string
  }
  course: {
    id: string
    name: string
    code: string
    ctaLabel: string | null
    ctaUrl: string | null
  }
  academy: {
    name: string
    brandColor: string
    website: string | null
  }
  template: {
    bodyText: string
    designConfig?: any
  }
  certificateUrl: string
  isPreviewMode: boolean
  /** Below Growth: show our default growth-loop CTA in place of the issuer's */
  showPlatformCta?: boolean
}

export default function CertificateView(props: CertificateViewProps) {
  const { certificate, learner, course, academy, template, certificateUrl, isPreviewMode, showPlatformCta = false } = props
  const [copied, setCopied] = useState(false)
  const [isRecipient, setIsRecipient] = useState(false)
  const [claimMode, setClaimMode] = useState<ClaimMode>('none')
  const [reducedMotion, setReducedMotion] = useState(false)
  // Resolve the claim moment once per page load (StrictMode re-runs effects)
  const claimResolved = useRef(false)

  const isV3 = template.designConfig && template.designConfig.version === 3
  const isV2 = template.designConfig && template.designConfig.version === 2
  const trackingEnabled = !isPreviewMode && !certificate.isPreview

  useEffect(() => {
    // Recipient arrives from the issue email (email link has recipient=true param)
    const urlParams = new URLSearchParams(window.location.search)
    const session = (() => {
      try {
        return window.sessionStorage
      } catch {
        return null
      }
    })()
    const storage = (() => {
      try {
        return window.localStorage
      } catch {
        return null
      }
    })()
    const recipient = resolveIsRecipient({ search: window.location.search, certificateNumber: certificate.number, session })
    setIsRecipient(recipient)

    // Tidy the recipient flag out of the address bar so a copied URL never
    // celebrates for the verifiers it is shared with
    const cleanUrl = stripRecipientParam(window.location.href)
    if (cleanUrl) window.history.replaceState(window.history.state, '', cleanUrl)

    // First view by the recipient celebrates; later visits get the static prompt.
    // Verifiers (no recipient flag), previews and invalid certificates get nothing.
    const firstResolve = !claimResolved.current
    claimResolved.current = true
    const mode: ClaimMode = !firstResolve ? 'none' : resolveClaimMode({
      isRecipient: recipient,
      status: certificate.status,
      isPreview: !trackingEnabled,
      certificateNumber: certificate.number,
      storage,
      medium: urlParams.get('utm_medium'),
    })
    if (firstResolve) {
      setReducedMotion(prefersReducedMotion(window))
      setClaimMode(mode)
      if (mode === 'celebrate') markCelebrated(storage, certificate.number)
    }

    if (trackingEnabled) {
      fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateNumber: certificate.number,
          type: 'page_view',
          referrer: document.referrer,
          isRecipient: recipient,
          utmSource: urlParams.get('utm_source'),
          utmMedium: urlParams.get('utm_medium'),
        }),
      })
      if (mode === 'celebrate') {
        fetch('/api/events/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({ certificateNumber: certificate.number, type: 'celebration_shown', isRecipient: true }),
        }).catch(() => {})
      }
    }
  }, [certificate.number, certificate.status, trackingEnabled])

  const renderedText = renderMergeFields(template.bodyText, {
    learnerName: learner.fullName,
    courseName: course.name,
    issueDate: certificate.issueDate,
    expiryDate: certificate.expiryDate,
    certificateNumber: certificate.number,
    custom: certificate.custom,
  })

  const linkedInUrl = generateLinkedInUrl({
    name: course.name,
    organizationName: academy.name,
    issueYear: certificate.issueDate.getFullYear(),
    issueMonth: certificate.issueDate.getMonth() + 1,
    expirationYear: certificate.expiryDate?.getFullYear(),
    expirationMonth: certificate.expiryDate ? certificate.expiryDate.getMonth() + 1 : undefined,
    certId: certificate.number,
    certUrl: tagCertificateUrl(certificateUrl, 'linkedin', 'profile'),
  })

  const ctaUrl = course.ctaUrl ? addUTMParams(course.ctaUrl, course.code, certificate.number) : null
  const postText = buildSharePostText({ courseName: course.name, academyName: academy.name, certificateUrl })
  const verifyLink = shortVerifyLink(certificateUrl)
  const qrUrl = tagCertificateUrl(certificateUrl, 'qr')
  const signupUrl = signupRefUrl('', certificate.number)

  async function handleCopyLink() {
    await navigator.clipboard.writeText(tagCertificateUrl(certificateUrl, 'copy'))
    trackAction('share_click', { channel: 'copy_link' })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function trackAction(type: string, meta?: Record<string, string>) {
    if (trackingEnabled) {
      await fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          certificateNumber: certificate.number,
          type,
          isRecipient,
          ...meta,
        }),
      }).catch(() => {})
    }
  }

  const onShare = (channel: ShareChannel) => trackAction('share_click', { channel })
  const claimStyle = celebrationStyle(claimMode, reducedMotion)
  const pdfUrl = `/api/certificates/${certificate.number}/pdf`

  function dismissClaim() {
    try {
      markPromptDismissed(window.localStorage, certificate.number)
    } catch {
      // storage blocked; just hide it for this view
    }
    setClaimMode('none')
  }

  const statusStyles =
    certificate.status === 'valid'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : certificate.status === 'expired'
      ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
      : 'bg-red-50 text-red-700 ring-red-600/20'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {(certificate.isPreview || isPreviewMode) && (
          <div className="mb-6 rounded-xl bg-yellow-50 p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Preview Mode - Events are not tracked
            </p>
          </div>
        )}

        {claimStyle !== 'none' && (
          <ClaimPrompt
            certificateNumber={certificate.number}
            learnerName={learner.fullName}
            courseName={course.name}
            academyName={academy.name}
            certificateUrl={certificateUrl}
            postText={postText}
            linkedInAddUrl={linkedInUrl}
            pdfUrl={pdfUrl}
            variant={claimStyle}
            onShare={onShare}
            onAddToLinkedIn={() => trackAction('linkedin_add_click')}
            onDownload={() => trackAction('pdf_download')}
            onDismiss={dismissClaim}
          />
        )}

        <div
          className={`bg-white shadow-sm ring-1 ring-gray-200 rounded-2xl overflow-hidden ${
            claimStyle === 'animated' ? 'animate-cert-reveal motion-reduce:animate-none' : ''
          }`}
          data-certificate-card
        >
          <div
            className="h-1.5"
            style={{ backgroundColor: academy.brandColor }}
          />

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Issued by</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
                  {academy.name}
                </h1>
                {academy.website && (
                  <a
                    href={academy.website}
                    className="text-sm text-gray-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {academy.website}
                  </a>
                )}
              </div>
              <div className="sm:text-right">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${statusStyles}`}>
                  {certificate.status === 'valid' && (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified · Valid
                    </>
                  )}
                  {certificate.status === 'expired' && 'Expired'}
                  {certificate.status === 'revoked' && 'Revoked'}
                </span>
              </div>
            </div>

            {isV3 && template.designConfig ? (
              <div className="mb-8 flex justify-center overflow-x-auto">
                <V3CertificateRenderer
                  design={template.designConfig as DesignConfigV3}
                  data={{
                    recipientName: learner.fullName,
                    certificateTitle: course.name,
                    orgName: academy.name,
                    issueDate: formatDate(certificate.issueDate),
                    certificateId: certificate.number,
                    description: template.bodyText || '',
                    issuerName: academy.name,
                  }}
                />
              </div>
            ) : isV2 && template.designConfig ? (
              <div className="mb-8 flex justify-center">
                <V2CertificateRenderer
                  design={template.designConfig as CertificateDesignV2}
                  data={{
                    recipientName: learner.fullName,
                    certificateTitle: course.name,
                    orgName: academy.name,
                    issueDate: formatDate(certificate.issueDate),
                    certificateId: certificate.number,
                    description: template.bodyText || '',
                  }}
                  certificateUrl={qrUrl}
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-8 mb-8 bg-gray-50">
                <div className="text-center whitespace-pre-wrap text-lg leading-relaxed">
                  {renderedText}
                </div>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Awarded to</dt>
                <dd className="text-base font-medium text-gray-900">{learner.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Credential</dt>
                <dd className="text-base text-gray-900">{course.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Certificate Number</dt>
                <dd className="text-base font-mono text-gray-900">{certificate.number}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Issue Date</dt>
                <dd className="text-base text-gray-900">{formatDate(certificate.issueDate)}</dd>
              </div>
              {certificate.expiryDate && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                    {certificate.status === 'expired' ? 'Expired On' : 'Valid Until'}
                  </dt>
                  <dd className="text-base text-gray-900">{formatDate(certificate.expiryDate)}</dd>
                </div>
              )}
              {certificate.status === 'revoked' && certificate.revokedAt && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Revoked On</dt>
                  <dd className="text-base text-gray-900">{formatDate(certificate.revokedAt)}</dd>
                  {certificate.revokeReason && (
                    <p className="text-sm text-gray-600 mt-1">{certificate.revokeReason}</p>
                  )}
                </div>
              )}
            </dl>

            {certificate.status === 'revoked' && certificate.revokedAt && (
              <div className="border-t pt-8 mb-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">This Certificate Has Been Revoked</h3>
                  <p className="text-sm text-red-700 mb-2">
                    Revoked on {formatDate(certificate.revokedAt)}
                  </p>
                  {certificate.revokeReason && (
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {certificate.revokeReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {certificate.status === 'valid' && (
              <>
                <div className="border-t pt-8 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share & Verify</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAction('linkedin_add_click')}
                      className="flex items-center justify-center px-4 py-3 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#0a66c2] hover:bg-[#004182]"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Add to LinkedIn
                    </a>
                    <a
                      href={pdfUrl}
                      onClick={() => trackAction('pdf_download')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Share to</p>
                    <SharePanel
                      certificateUrl={certificateUrl}
                      postText={postText}
                      courseName={course.name}
                      academyName={academy.name}
                      onShare={onShare}
                      compact
                    />
                  </div>
                </div>

                {showPlatformCta && (
                  <div className="border-t pt-8 mb-8" data-cta="platform">
                    <a
                      href={signupUrl}
                      onClick={() => trackAction('cta_click', { cta: 'platform' })}
                      className="block w-full text-center px-6 py-4 rounded-xl shadow-sm text-base font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors"
                    >
                      Verified by {BRAND.name} &middot; Create your first certificate →
                    </a>
                  </div>
                )}

                {!showPlatformCta && ctaUrl && course.ctaLabel && (
                  <div className="border-t pt-8 mb-8" data-cta="issuer">
                    <a
                      href={ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAction('cta_click', { cta: 'issuer' })}
                      className="block w-full text-center px-6 py-4 rounded-xl shadow-sm text-base font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: academy.brandColor }}
                    >
                      {course.ctaLabel} →
                    </a>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl bg-slate-50 p-5">
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Verify this certificate</h3>
                  <p className="text-xs text-gray-600 mb-2">Scan the QR code or visit the verification link:</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{verifyLink}</p>
                </div>
                <div className="flex-shrink-0 rounded-lg bg-white p-2 ring-1 ring-gray-200">
                  <QRCodeDisplay url={qrUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <VerifiedByFooter signupUrl={signupUrl} onClick={() => trackAction('verified_by_click')} />
      </div>
    </div>
  )
}

function addUTMParams(url: string, courseCode: string, certificateNumber: string): string {
  const urlObj = new URL(url)
  urlObj.searchParams.set('utm_source', 'credential')
  urlObj.searchParams.set('utm_medium', 'referral')
  urlObj.searchParams.set('utm_campaign', courseCode)
  urlObj.searchParams.set('utm_content', certificateNumber)
  return urlObj.toString()
}
