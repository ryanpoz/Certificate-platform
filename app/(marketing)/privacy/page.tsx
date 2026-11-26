import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Privacy Policy - ${BRAND.name}`,
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="bg-tint border border-rule rounded-card p-4 mb-8">
        <p className="text-sm text-brass">
          <strong>Draft:</strong> This privacy policy is a placeholder and should be reviewed by legal counsel before production use.
        </p>
      </div>
      <h1 className="display-1 mb-8">Privacy Policy</h1>
      <div className="max-w-none">
        <p className="text-ink-soft">Last updated: {new Date().toLocaleDateString()}</p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide when creating an account and issuing certificates, including names, email addresses, and certificate details.</p>
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
