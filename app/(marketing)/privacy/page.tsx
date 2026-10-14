import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Privacy Policy - ${BRAND.name}`,
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800">
          <strong>Draft:</strong> This privacy policy is a placeholder and should be reviewed by legal counsel before production use.
        </p>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide when creating an academy and issuing certificates, including names, email addresses, and certificate details.</p>
        <h2>How We Use Your Information</h2>
        <p>We use your information to provide the certificate platform service, send email notifications, and display public certificate verification pages.</p>
        <h2>Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your data.</p>
        <h2>Contact</h2>
        <p>For privacy questions, contact us at {BRAND.supportEmail}</p>
      </div>
    </div>
  )
}
