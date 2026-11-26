import { BRAND } from '@/lib/config/brand'

export const metadata = {
  title: `Terms of Service - ${BRAND.name}`,
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="bg-cheer-tint border border-rule rounded-card p-4 mb-8">
        <p className="text-sm text-gold">
          <strong>Draft:</strong> These terms of service are a placeholder and should be reviewed by legal counsel before production use.
        </p>
      </div>
      <h1 className="display-1 mb-8">Terms of Service</h1>
      <div className="max-w-none">
        <p className="text-ink-soft">Last updated: {new Date().toLocaleDateString()}</p>
        <h2>Acceptance of Terms</h2>
        <p>By using {BRAND.name}, you agree to these terms of service.</p>
        <h2>Service Description</h2>
        <p>{BRAND.name} provides a platform for issuing and managing digital certificates.</p>
        <h2>User Responsibilities</h2>
        <p>You are responsible for the accuracy of certificate information and compliance with applicable laws.</p>
        <h2>Pricing and Payment</h2>
        <p>Pricing is as stated on our pricing page. Billing is monthly or annual, and your full yearly certificate allowance is available from the start of each plan year. You can cancel anytime.</p>
        <h2>Plan Changes and Cancellation</h2>
        <p>Downgrades and cancellations take effect at the end of your current billing period. You can&apos;t move to a plan whose yearly limit is below the certificates you&apos;ve already issued in your current plan year until that plan year resets, but you can always cancel to the Free plan. On Free, new issuing is paused until your plan year resets or you upgrade.</p>
        <p>Certificates you have issued stay live and verifiable after any plan change or cancellation, and you can revoke certificates on any plan. Features above your plan are locked, not deleted: your data and settings are kept and return when you upgrade. If you use a custom domain, links on it redirect to our domain after you leave the plan that includes it, provided your DNS still points to us.</p>
        <h2>Contact</h2>
        <p>For questions about these terms, contact us at {BRAND.supportEmail}</p>
      </div>
    </div>
  )
}
