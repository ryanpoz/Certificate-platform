'use client'

import { BRAND } from '@/lib/config/brand'

/** "Verified by" mark with a call to action for viewers who issue certificates themselves */
export default function VerifiedByFooter({ signupUrl, onClick }: { signupUrl: string; onClick?: () => void }) {
  return (
    <footer className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {BRAND.name.charAt(0)}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Verified by {BRAND.name}</p>
            <p className="text-xs text-gray-500">
              Secure, shareable certificates for training providers, associations and organisations.
            </p>
          </div>
        </div>
        <a
          href={signupUrl}
          onClick={onClick}
          className="inline-flex shrink-0 items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Create your first certificate →
        </a>
      </div>
    </footer>
  )
}
