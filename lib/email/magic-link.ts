import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

export async function sendMagicLink(email: string, magicLink: string): Promise<void> {
  const subject = 'Your login link'
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1f2937;">Log in to your account</h1>
  <p style="color: #4b5563; font-size: 16px;">Click the link below to log in. This link expires in 15 minutes.</p>
  <p style="margin: 30px 0;">
    <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
      Log in
    </a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">
    Or copy and paste this URL into your browser:<br>
    <a href="${magicLink}" style="color: #2563eb;">${magicLink}</a>
  </p>
</body>
</html>
  `

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: emailFrom,
        to: email,
        subject,
        html,
      })
      
      if (result.error) {
        console.error('Resend email failed:', result.error)
        throw new Error(`Failed to send email: ${result.error.message}`)
      }
      
      console.log(`Magic link sent to ${email} via Resend (ID: ${result.data?.id})`)
    } catch (error) {
      console.error('Failed to send magic link email:', error)
      console.log(`[FALLBACK] Magic link for ${email}: ${magicLink}`)
      throw error
    }
  } else {
    console.log(`[NO RESEND_API_KEY] Magic link for ${email}: ${magicLink}`)
  }
}
