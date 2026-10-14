'use client'

import { useEffect, useState } from 'react'
import { formatDate, renderMergeFields } from '@/lib/utils/helpers'
import { generateLinkedInUrl } from '@/lib/email/resend'
import QRCodeDisplay from './qr-code'

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
  }
  certificateUrl: string
  isPreviewMode: boolean
}

export default function CertificateView(props: CertificateViewProps) {
  const { certificate, learner, course, academy, template, certificateUrl, isPreviewMode } = props
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isPreviewMode && !certificate.isPreview) {
      fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateNumber: certificate.number,
          type: 'page_view',
          referrer: document.referrer,
        }),
      })
    }
  }, [certificate.number, certificate.isPreview, isPreviewMode])

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
    certUrl: certificateUrl,
  })

  const ctaUrl = course.ctaUrl ? addUTMParams(course.ctaUrl, course.code, certificate.number) : null

  async function handleCopyLink() {
    await navigator.clipboard.writeText(certificateUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function trackAction(type: string) {
    if (!isPreviewMode && !certificate.isPreview) {
      await fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateNumber: certificate.number,
          type,
        }),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {(certificate.isPreview || isPreviewMode) && (
          <div className="mb-6 rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Preview Mode - Events are not tracked
            </p>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div
            className="h-2"
            style={{ backgroundColor: academy.brandColor }}
          />

          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {academy.name}
                </h1>
                {academy.website && (
                  <a
                    href={academy.website}
                    className="text-sm text-gray-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {academy.website}
                  </a>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    certificate.status === 'valid'
                      ? 'bg-green-100 text-green-800'
                      : certificate.status === 'expired'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {certificate.status === 'valid' && '✓ Valid'}
                  {certificate.status === 'expired' && 'Expired'}
                  {certificate.status === 'revoked' && 'Revoked'}
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-8 mb-8 bg-gray-50">
              <div className="text-center whitespace-pre-wrap text-lg leading-relaxed">
                {renderedText}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Certificate Number</h3>
                <p className="text-base font-mono text-gray-900">{certificate.number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Issue Date</h3>
                <p className="text-base text-gray-900">{formatDate(certificate.issueDate)}</p>
              </div>
              {certificate.expiryDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {certificate.status === 'expired' ? 'Expired On' : 'Valid Until'}
                  </h3>
                  <p className="text-base text-gray-900">{formatDate(certificate.expiryDate)}</p>
                </div>
              )}
              {certificate.status === 'revoked' && certificate.revokedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Revoked On</h3>
                  <p className="text-base text-gray-900">{formatDate(certificate.revokedAt)}</p>
                  {certificate.revokeReason && (
                    <p className="text-sm text-gray-600 mt-1">{certificate.revokeReason}</p>
                  )}
                </div>
              )}
            </div>

            {certificate.status === 'valid' && (
              <>
                <div className="border-t pt-8 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share & Verify</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAction('linkedin_add_click')}
                      className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0a66c2] hover:bg-[#004182]"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Add to LinkedIn
                    </a>
                    <a
                      href={`/api/certificates/${certificate.number}/pdf`}
                      onClick={() => trackAction('pdf_download')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {ctaUrl && course.ctaLabel && (
                  <div className="border-t pt-8 mb-8">
                    <a
                      href={ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAction('cta_click')}
                      className="block w-full text-center px-6 py-4 border-2 border-transparent rounded-lg shadow-sm text-base font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: academy.brandColor }}
                    >
                      {course.ctaLabel} →
                    </a>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Verify Certificate</h3>
                  <p className="text-xs text-gray-600">Scan QR code or visit:</p>
                  <p className="text-xs text-gray-600 break-all">{certificateUrl}</p>
                </div>
                <div className="flex-shrink-0">
                  <QRCodeDisplay url={certificateUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Certificate Platform</p>
        </div>
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
