/**
 * Email branding (Starter and up, via the `brandedEmail` entitlement).
 *
 * Branded: the email comes from the account's sender name and replies go to
 * its reply-to address.
 * Unbranded (Free): the email comes from the platform name with no custom
 * reply-to. The account's saved sender name and reply-to are kept, just not
 * applied, so they come back on upgrade.
 *
 * Every certificate email carries the "Verified by" footer on all plans
 * (removing it is the Business white-label feature, not this one).
 */
import { BRAND } from '@/lib/config/brand'
import { can, type AccountLike } from '@/lib/billing/entitlements'

export interface EmailBranding {
  branded: boolean
}

export function emailBrandingFor(account: AccountLike | null | undefined): EmailBranding {
  return { branded: can(account, 'brandedEmail') }
}

export interface EmailIdentity {
  fromName: string
  /** undefined = no Reply-To header */
  replyTo?: string
  /** Footer line telling the learner who to contact */
  contactLine: string
}

export function emailIdentity(
  branding: EmailBranding,
  academy: { name: string; senderName?: string | null; replyTo?: string | null }
): EmailIdentity {
  if (branding.branded) {
    const replyTo = academy.replyTo || undefined
    return {
      fromName: academy.senderName || academy.name,
      replyTo,
      contactLine: replyTo
        ? `Questions? Reply to this email or contact ${replyTo}`
        : `Questions? Contact ${academy.name}`,
    }
  }
  return {
    fromName: BRAND.name,
    contactLine: `Questions about this certificate? Contact ${academy.name}.`,
  }
}
