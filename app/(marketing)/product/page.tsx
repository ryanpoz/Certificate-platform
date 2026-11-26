import { BRAND } from '@/lib/config/brand'
import Link from 'next/link'
import { QrSample } from '@/components/marketing/certificate-visual'

export const metadata = {
  title: `Product - ${BRAND.name}`,
  description: 'Issue, verify, and track digital certificates that drive LinkedIn reach',
}

export default function ProductPage() {
  return (
    <div className="">
      {/* Hero */}
      <div className="py-24">
        <div className="site-wrap text-center">
          <h1 className="display-1 mb-6">
            Everything you need to issue certificates that prove impact
          </h1>
          <p className="lede max-w-3xl mx-auto">
            From CSV upload to a verification page, QR code, and LinkedIn shares in minutes. Share and click analytics are on the Growth plan.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="site-wrap py-24 space-y-32">
        
        {/* Issuing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="display-2 mb-4">Bulk issuing</h2>
            <p className="lede mb-6">
              Upload a CSV with names and emails. We validate, deduplicate, and create certificates in seconds. Up to 5,000 rows at once.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Automatic column mapping</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Row-by-row validation with error reporting</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Idempotent publishing—safe to retry</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Single-person form for one-off certificates</span>
              </li>
            </ul>
          </div>
          <div className="bg-paper rounded-card p-6 border border-rule">
            <div className="text-sm text-muted mb-4">CSV Upload</div>
            <div className="space-y-2 text-sm font-mono">
              <div className="text-valid">✓ Row 1: jane@example.com</div>
              <div className="text-valid">✓ Row 2: john@example.com</div>
              <div className="text-valid">✓ Row 3: sarah@example.com</div>
              <div className="text-muted">...</div>
              <div className="text-valid">✓ 847 valid rows</div>
            </div>
          </div>
        </div>

        {/* Certificate Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-paper rounded-card shadow-soft p-6 border border-rule">
            <div className="border-b border-rule pb-4 mb-4">
              <div className="font-semibold text-ink mb-1">Creative Strategy Certification</div>
              <div className="text-sm text-ink-soft">Northwind Training</div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Issued:</span>
                <span className="text-ink">Jan 15, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Certificate #:</span>
                <span className="text-ink font-mono">CSB-2026-0123</span>
              </div>
            </div>
            <button className="w-full bg-[#0a66c2] text-white py-2 rounded-btn font-medium text-sm mb-2">
              Add to LinkedIn
            </button>
            <div className="flex items-center justify-center py-3 border-t border-rule">
              <QrSample className="h-24 w-24" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="display-2 mb-4">Certificate pages & verification</h2>
            <p className="lede mb-6">
              Every certificate gets a public verification page with a QR code, PDF download, and one-click LinkedIn sharing.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Verification pages in your brand colors</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">QR code for instant verification</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">PDF download with QR code</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Revocation with reason shown publicly</span>
              </li>
            </ul>
          </div>
        </div>

        {/* LinkedIn Sharing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="display-2 mb-4">LinkedIn sharing</h2>
            <p className="lede mb-6">
              One-click &quot;Add to LinkedIn&quot; button pre-filled with the certificate name, dates, and verification URL. Share tracking is on the Growth plan.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Pre-filled certification data</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Track clicks back to your site (Growth plan)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">See which certificates drive the most reach (Growth plan)</span>
              </li>
            </ul>
          </div>
          <div className="bg-tint rounded-card p-6 border border-rule">
            <div className="text-sm text-ink-soft mb-4">Example: LinkedIn certification</div>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> Creative Strategy Certification</div>
              <div><strong>Organization:</strong> Northwind Training</div>
              <div><strong>Issue date:</strong> January 2026</div>
              <div><strong>Credential URL:</strong> certificate-platform.../CSB-2026-0123</div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-paper rounded-card p-6 border border-rule">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-btn border border-rule bg-cream px-4 py-3 text-sm font-medium text-ink">Issued</div>
              <div className="rounded-btn border border-rule bg-cream px-4 py-3 text-sm font-medium text-ink">Delivered</div>
              <div className="rounded-btn border border-rule bg-cream px-4 py-3 text-sm font-medium text-ink">Viewed</div>
              <div className="rounded-btn border border-rule bg-cream px-4 py-3 text-sm font-medium text-ink">LinkedIn shares</div>
              <div className="rounded-btn border border-rule bg-cream px-4 py-3 text-sm font-medium text-ink">Clicks to your site</div>
              <div className="rounded-btn border border-rule bg-cream px-4 py-3 text-sm font-medium text-ink">Trend over time</div>
            </div>
            <p className="fine mt-4">On Growth, your dashboard shows these metrics per program</p>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="display-2 mb-4">Share and click analytics</h2>
            <p className="lede mb-6">
              On the Growth and Business plans, see exactly how your certificates perform. Issued, delivered, viewed, shared to LinkedIn, and clicks back to your site.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Funnel metrics with conversion rates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Per-program breakdown</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Bot filtering for accurate data</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Trend over time</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Managing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="display-2 mb-4">Managing certificates</h2>
            <p className="lede mb-6">
              Search, filter, edit, reissue, and revoke certificates. Bulk actions for publishing, revoking, and CSV export.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Search by name, email, or certificate number</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Filter by program, status, date, engagement</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Edit, reissue, or revoke individual certificates (revoking is available on every plan)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Bulk actions apply to all filtered results</span>
              </li>
            </ul>
          </div>
          <div className="bg-paper rounded-card p-6 border border-rule">
            <div className="text-sm text-muted mb-4">Certificate Management</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-rule">
                <span className="text-ink">Jane Smith</span>
                <span className="text-xs px-2 py-1 bg-valid-soft text-valid rounded-badge">Published</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-rule">
                <span className="text-ink">John Doe</span>
                <span className="text-xs px-2 py-1 bg-[#F3E9D2] text-brass rounded-badge">Pending Changes</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-rule">
                <span className="text-ink">Sarah Lee</span>
                <span className="text-xs px-2 py-1 bg-valid-soft text-valid rounded-badge">Published</span>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-paper rounded-card shadow-soft p-6 border-2 border-stamp">
              <div className="border-b border-rule pb-4 mb-4">
                <div className="font-semibold text-ink mb-1">Your Program Name</div>
                <div className="text-sm" style={{ color: '#8E1B1B' }}>Your Organisation</div>
              </div>
              <div className="text-sm text-ink-soft">Your branding, your colors</div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="display-2 mb-4">Your branding</h2>
            <p className="lede mb-6">
              Customize certificate pages with your brand colors. Branded email (your sender name and reply-to) is on Starter and above. A custom domain is coming soon on Business.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Custom brand colors on certificate pages</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Customizable email templates with merge fields</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Emails from your sender name and reply-to (Starter plan)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 w-[18px] flex-shrink-0 font-bold text-valid" aria-hidden="true">✓</span>
                <span className="text-ink-soft">Custom domains (Business plan, coming soon)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-ink py-20">
        <div className="site-wrap text-center">
          <h2 className="display-2 !text-parchment mb-4">
            Ready to drive reach with certificates?
          </h2>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="btn btn-on-ink"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="btn btn-ghost-light"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
