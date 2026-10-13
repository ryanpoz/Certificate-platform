import { customAlphabet } from 'nanoid'

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const nanoid = customAlphabet(ALPHABET, 4)

export function generateCertificateNumber(academySlug: string): string {
  const prefix = academySlug.toUpperCase().slice(0, 3).padEnd(3, 'X')
  return `${prefix}-${nanoid()}-${nanoid()}`
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function calculateExpiryDate(issueDate: Date, validityMonths: number | null): Date | null {
  if (!validityMonths) return null
  const expiry = new Date(issueDate)
  expiry.setMonth(expiry.getMonth() + validityMonths)
  return expiry
}

export function renderMergeFields(
  template: string,
  data: {
    learnerName: string
    courseName: string
    issueDate: Date
    expiryDate: Date | null
    certificateNumber: string
    custom?: Record<string, any>
  }
): string {
  let rendered = template
  rendered = rendered.replace(/\{\{learner\.name\}\}/g, data.learnerName)
  rendered = rendered.replace(/\{\{course\.name\}\}/g, data.courseName)
  rendered = rendered.replace(/\{\{issue_date\}\}/g, formatDate(data.issueDate))
  rendered = rendered.replace(/\{\{expiry_date\}\}/g, data.expiryDate ? formatDate(data.expiryDate) : 'No expiry')
  rendered = rendered.replace(/\{\{certificate\.number\}\}/g, data.certificateNumber)
  
  if (data.custom) {
    Object.entries(data.custom).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{custom\\.${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })
  }
  
  return rendered
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
