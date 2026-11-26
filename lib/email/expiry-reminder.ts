/**
 * Copy for expiry reminder emails (Growth and up). Sent to the certificate's
 * recipient 30 and 7 days before it expires. The sender name and reply-to
 * follow the branded-email entitlement, like certificate emails.
 */
import { BRAND } from '@/lib/config/brand'
import { formatResetDate } from '@/lib/billing/plans'
import { daysLeftPhrase } from '@/lib/reminders/schedule'
import { emailIdentity, type EmailBranding, type EmailIdentity } from './branding'

export interface ExpiryReminderInput {
  learnerName: string
  courseName: string
  academyName: string
  academySenderName?: string | null
  academyReplyTo?: string | null
  certificateNumber: string
  certificateUrl: string
  expiryDate: Date
  daysLeft: number
  branding: EmailBranding
}

export interface ExpiryReminderContent {
  identity: EmailIdentity
  subject: string
  text: string
  html: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function expiryReminderContent(input: ExpiryReminderInput): ExpiryReminderContent {
  const identity = emailIdentity(input.branding, {
    name: input.academyName,
    senderName: input.academySenderName,
    replyTo: input.academyReplyTo,
  })
  const when = daysLeftPhrase(input.daysLeft)
  const date = formatResetDate(input.expiryDate)
  const subject = `Your ${input.courseName} certificate expires ${when}`
  const viewUrl = `${input.certificateUrl}?recipient=true&utm_source=email&utm_medium=expiry_reminder`

  const paragraphs = [
    `Hi ${input.learnerName},`,
    `Your ${input.courseName} certificate from ${input.academyName} expires on ${date}.`,
    `To keep your certification current, contact ${input.academyName} about renewing before then. After that date, your certificate page will show it as expired.`,
  ]
  const text = [
    ...paragraphs,
    `View your certificate: ${viewUrl}`,
    `Certificate number: ${input.certificateNumber}`,
    identity.contactLine,
    `You're receiving this because ${input.academyName} issued you this certificate.`,
    `Verified by ${BRAND.name}`,
  ].join('\n\n')

  const e = escapeHtml
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">${e(input.academyName)}</h1>
  </div>
  ${paragraphs.map((p) => `<p style="margin: 0 0 16px 0;">${e(p)}</p>`).join('\n  ')}
  <div style="text-align: center; margin: 32px 0;">
    <a href="${e(viewUrl)}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View certificate</a>
  </div>
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; font-size: 14px; color: #6b7280;">
    <p>Certificate number: <strong>${e(input.certificateNumber)}</strong></p>
    <p style="margin: 0 0 8px 0;">${e(identity.contactLine)}</p>
    <p style="margin: 0;">You're receiving this because ${e(input.academyName)} issued you this certificate.</p>
  </div>
  <div style="margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
    Verified by ${e(BRAND.name)}
  </div>
</body>
</html>
  `.trim()

  return { identity, subject, text, html }
}
