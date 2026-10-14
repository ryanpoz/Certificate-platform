import { Resend } from 'resend'
import { renderMergeFields } from '../utils/helpers'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface SendCertificateEmailParams {
  to: string
  learnerName: string
  courseName: string
  certificateNumber: string
  issueDate: Date
  expiryDate: Date | null
  academyName: string
  academySenderName: string
  academyReplyTo: string
  emailSubject: string
  emailBody: string
  certificateUrl: string
}

export async function sendCertificateEmail(params: SendCertificateEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mergeData = {
    learnerName: params.learnerName,
    courseName: params.courseName,
    issueDate: params.issueDate,
    expiryDate: params.expiryDate,
    certificateNumber: params.certificateNumber,
  }

  const subject = renderMergeFields(params.emailSubject, mergeData)
  const bodyText = renderMergeFields(params.emailBody, mergeData)

  const linkedInUrl = generateLinkedInUrl({
    name: params.courseName,
    organizationName: params.academyName,
    issueYear: params.issueDate.getFullYear(),
    issueMonth: params.issueDate.getMonth() + 1,
    expirationYear: params.expiryDate?.getFullYear(),
    expirationMonth: params.expiryDate ? params.expiryDate.getMonth() + 1 : undefined,
    certId: params.certificateNumber,
    certUrl: params.certificateUrl,
  })

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">${params.academyName}</h1>
  </div>
  
  <div style="white-space: pre-wrap; margin-bottom: 30px;">${bodyText}</div>
  
  <div style="text-align: center; margin: 40px 0;">
    <a href="${params.certificateUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 8px 8px 0;">View Certificate</a>
    <a href="${linkedInUrl}" style="display: inline-block; padding: 14px 32px; background: #0a66c2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 0 8px 8px 0;">Add to LinkedIn</a>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; font-size: 14px; color: #6b7280;">
    <p>Certificate Number: <strong>${params.certificateNumber}</strong></p>
    <p style="margin: 0;">Questions? Reply to this email or contact ${params.academyReplyTo}</p>
  </div>
</body>
</html>
  `.trim()

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `${params.academySenderName} <onboarding@resend.dev>`,
        to: params.to,
        subject,
        html: htmlBody,
        replyTo: params.academyReplyTo,
      })

      if (result.error) {
        console.error('Resend error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data?.id }
    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      return { success: false, error: String(error) }
    }
  } else {
    console.log('\n=== CERTIFICATE EMAIL (Resend API key not set) ===')
    console.log('To:', params.to)
    console.log('Subject:', subject)
    console.log('Certificate URL:', params.certificateUrl)
    console.log('LinkedIn URL:', linkedInUrl)
    console.log('\nBody:\n', bodyText)
    console.log('=== END EMAIL ===\n')
    
    return { success: true, messageId: 'console-fallback' }
  }
}

function generateLinkedInUrl(params: {
  name: string
  organizationName: string
  issueYear: number
  issueMonth: number
  expirationYear?: number
  expirationMonth?: number
  certId: string
  certUrl: string
}): string {
  const baseUrl = 'https://www.linkedin.com/profile/add'
  const queryParams = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: params.name,
    organizationName: params.organizationName,
    issueYear: String(params.issueYear),
    issueMonth: String(params.issueMonth),
    certId: params.certId,
    certUrl: params.certUrl,
  })

  if (params.expirationYear && params.expirationMonth) {
    queryParams.append('expirationYear', String(params.expirationYear))
    queryParams.append('expirationMonth', String(params.expirationMonth))
  }

  return `${baseUrl}?${queryParams.toString()}`
}

export { generateLinkedInUrl }
