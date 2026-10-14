import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Terms of Service - ${BRAND.name}`,
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800">
          <strong>Draft:</strong> These terms of service are a placeholder and should be reviewed by legal counsel before production use.
        </p>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        <h2>Acceptance of Terms</h2>
        <p>By using {BRAND.name}, you agree to these terms of service.</p>
        <h2>Service Description</h2>
        <p>{BRAND.name} provides a platform for issuing and managing digital certificates.</p>
        <h2>User Responsibilities</h2>
        <p>You are responsible for the accuracy of certificate information and compliance with applicable laws.</p>
        <h2>Pricing and Payment</h2>
        <p>Pricing is as stated on our pricing page. Monthly billing, cancel anytime.</p>
        <h2>Contact</h2>
        <p>For questions about these terms, contact us at {BRAND.supportEmail}</p>
      </div>
    </div>
  )
}
