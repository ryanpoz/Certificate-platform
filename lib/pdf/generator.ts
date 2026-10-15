import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { formatDate, renderMergeFields } from '../utils/helpers'

// @ts-ignore
import QRCode from 'qrcode'

export interface GeneratePDFParams {
  certificateNumber: string
  learnerName: string
  courseName: string
  issueDate: Date
  expiryDate: Date | null
  academyName: string
  brandColor: string
  bodyText: string
  custom: Record<string, any>
  certificateUrl: string
  designConfig?: any // Template design config with logo, background, signatures
}

export async function generateCertificatePDF(params: GeneratePDFParams): Promise<Buffer> {
  const qrCodeDataUrl = await QRCode.toDataURL(params.certificateUrl, {
    width: 200,
    margin: 2,
  })

  const renderedText = renderMergeFields(params.bodyText, {
    learnerName: params.learnerName,
    courseName: params.courseName,
    issueDate: params.issueDate,
    expiryDate: params.expiryDate,
    certificateNumber: params.certificateNumber,
    custom: params.custom,
  })

  // Support template background images (including data URLs)
  const backgroundStyle = params.designConfig?.background?.type === 'image' && params.designConfig.background.value
    ? `background-image: url('${params.designConfig.background.value}'); background-size: cover; background-position: center; opacity: ${params.designConfig.background.opacity || 1};`
    : params.designConfig?.background?.type === 'gradient' && params.designConfig.background.value
    ? `background: ${params.designConfig.background.value};`
    : `background: ${params.designConfig?.background?.value || 'white'};`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: white;
    }
    .page {
      width: 8.5in;
      height: 11in;
      padding: 0.75in;
      box-sizing: border-box;
      position: relative;
      ${backgroundStyle}
    }
    .logo {
      max-width: 200px;
      max-height: 100px;
      margin-bottom: 20px;
    }
    .header {
      border-bottom: 4px solid ${params.brandColor};
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .academy-name {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      margin: 0;
    }
    .certificate-body {
      border: 3px solid #e5e7eb;
      padding: 60px 40px;
      margin: 40px 0;
      background: #f9fafb;
      text-align: center;
      font-size: 18px;
      line-height: 1.8;
      white-space: pre-wrap;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .detail-item {
      margin-bottom: 15px;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 16px;
      color: #1f2937;
      font-family: 'Courier New', monospace;
    }
    .footer {
      position: absolute;
      bottom: 0.75in;
      left: 0.75in;
      right: 0.75in;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    .verify-section {
      flex: 1;
    }
    .verify-label {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .verify-url {
      font-size: 10px;
      color: #4b5563;
      word-break: break-all;
    }
    .qr-code {
      width: 100px;
      height: 100px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${params.designConfig?.logo?.url ? `<img src="${params.designConfig.logo.url}" alt="Logo" class="logo" />` : ''}
      <h1 class="academy-name">${params.academyName}</h1>
    </div>
    
    <div class="certificate-body">
      <div>${renderedText}</div>
    </div>
    
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Certificate Number</div>
        <div class="detail-value">${params.certificateNumber}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Issue Date</div>
        <div class="detail-value">${formatDate(params.issueDate)}</div>
      </div>
      ${params.expiryDate ? `
      <div class="detail-item">
        <div class="detail-label">Valid Until</div>
        <div class="detail-value">${formatDate(params.expiryDate)}</div>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <div class="verify-section">
        <div class="verify-label">Verify This Certificate</div>
        <div class="verify-url">${params.certificateUrl}</div>
        ${params.designConfig?.signatures?.length ? `
          <div style="display: flex; gap: 40px; margin-top: 20px;">
            ${params.designConfig.signatures.map((sig: any) => `
              <div style="text-align: center;">
                ${sig.type === 'image' && sig.value ? `<img src="${sig.value}" alt="Signature" style="max-width: 150px; max-height: 60px; margin-bottom: 8px;" />` : ''}
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${sig.type === 'text' ? sig.value : ''}</div>
                <div style="font-size: 11px; color: #6b7280;">${sig.title || ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />
    </div>
  </div>
</body>
</html>
  `

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
