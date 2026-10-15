export interface CertificateDesignConfig {
  // Starter template type
  starter?: 'modern' | 'classic' | 'minimal' | 'bold'
  
  // Logo
  logo?: {
    url?: string
    size: 'small' | 'medium' | 'large'
    position: 'top-left' | 'top-center' | 'top-right'
  }
  
  // Colors
  colors: {
    primary: string
    accent: string
    background: string
    text: string
  }
  
  // Typography
  fonts: {
    heading: string
    body: string
    pair: 'playfair-lato' | 'montserrat-opensans' | 'merriweather-pt' | 'roboto-slab-roboto' | 'inter-inter' | 'cormorant-nunito'
  }
  
  // Background
  background: {
    type: 'color' | 'pattern' | 'image'
    value: string // hex color, pattern name, or image URL
    opacity?: number
  }
  
  // Border
  border: {
    style: 'none' | 'simple' | 'double' | 'ornamental' | 'modern'
    color: string
    width: number
  }
  
  // Layout
  layout: {
    alignment: 'center' | 'left'
    titleText: string
    spacing: 'compact' | 'normal' | 'spacious'
  }
  
  // Body text with merge fields
  bodyText: string
  
  // Signatures
  signatures: Array<{
    type: 'image' | 'text'
    value: string // URL for image, name for text
    title: string
    font?: string // script font for text signatures
  }>
  
  // Optional elements
  showQrCode: boolean
  showCertNumber: boolean
  showExpiryDate: boolean
}

export const FONT_PAIRS = [
  {
    id: 'playfair-lato',
    name: 'Playfair Display & Lato',
    heading: 'Playfair Display',
    body: 'Lato',
    style: 'elegant',
  },
  {
    id: 'montserrat-opensans',
    name: 'Montserrat & Open Sans',
    heading: 'Montserrat',
    body: 'Open Sans',
    style: 'modern',
  },
  {
    id: 'merriweather-pt',
    name: 'Merriweather & PT Sans',
    heading: 'Merriweather',
    body: 'PT Sans',
    style: 'classic',
  },
  {
    id: 'roboto-slab-roboto',
    name: 'Roboto Slab & Roboto',
    heading: 'Roboto Slab',
    body: 'Roboto',
    style: 'professional',
  },
  {
    id: 'inter-inter',
    name: 'Inter',
    heading: 'Inter',
    body: 'Inter',
    style: 'minimal',
  },
  {
    id: 'cormorant-nunito',
    name: 'Cormorant & Nunito',
    heading: 'Cormorant',
    body: 'Nunito',
    style: 'sophisticated',
  },
] as const

export const MERGE_FIELDS = [
  { key: '{{recipient_name}}', label: 'Recipient Name' },
  { key: '{{program_name}}', label: 'Program Name' },
  { key: '{{issue_date}}', label: 'Issue Date' },
  { key: '{{expiry_date}}', label: 'Expiry Date' },
  { key: '{{certificate_number}}', label: 'Certificate Number' },
  { key: '{{academy_name}}', label: 'Academy Name' },
] as const

export const STARTER_TEMPLATES: Record<string, Partial<CertificateDesignConfig>> = {
  modern: {
    starter: 'modern',
    colors: {
      primary: '#2563eb',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans',
      pair: 'montserrat-opensans',
    },
    background: {
      type: 'color',
      value: '#ffffff',
    },
    border: {
      style: 'modern',
      color: '#2563eb',
      width: 8,
    },
    layout: {
      alignment: 'center',
      titleText: 'Certificate of Completion',
      spacing: 'normal',
    },
    bodyText: 'This certificate is proudly presented to\n\n{{recipient_name}}\n\nfor successfully completing\n\n{{program_name}}\n\non {{issue_date}}',
    signatures: [],
    showQrCode: true,
    showCertNumber: true,
    showExpiryDate: false,
  },
  classic: {
    starter: 'classic',
    colors: {
      primary: '#854d0e',
      accent: '#a16207',
      background: '#fefce8',
      text: '#292524',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
      pair: 'playfair-lato',
    },
    background: {
      type: 'color',
      value: '#fefce8',
    },
    border: {
      style: 'ornamental',
      color: '#854d0e',
      width: 12,
    },
    layout: {
      alignment: 'center',
      titleText: 'Certificate of Achievement',
      spacing: 'spacious',
    },
    bodyText: 'This is to certify that\n\n{{recipient_name}}\n\nhas successfully completed the course\n\n{{program_name}}\n\nawarded on {{issue_date}}',
    signatures: [],
    showQrCode: false,
    showCertNumber: true,
    showExpiryDate: false,
  },
  minimal: {
    starter: 'minimal',
    colors: {
      primary: '#18181b',
      accent: '#71717a',
      background: '#ffffff',
      text: '#09090b',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      pair: 'inter-inter',
    },
    background: {
      type: 'color',
      value: '#ffffff',
    },
    border: {
      style: 'simple',
      color: '#e4e4e7',
      width: 2,
    },
    layout: {
      alignment: 'left',
      titleText: 'Certificate',
      spacing: 'spacious',
    },
    bodyText: '{{recipient_name}}\n\nSuccessfully completed {{program_name}}\n\n{{issue_date}}',
    signatures: [],
    showQrCode: true,
    showCertNumber: true,
    showExpiryDate: false,
  },
  bold: {
    starter: 'bold',
    colors: {
      primary: '#dc2626',
      accent: '#ef4444',
      background: '#dc2626',
      text: '#ffffff',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans',
      pair: 'montserrat-opensans',
    },
    background: {
      type: 'color',
      value: '#dc2626',
    },
    border: {
      style: 'none',
      color: '#ffffff',
      width: 0,
    },
    layout: {
      alignment: 'center',
      titleText: 'Certificate of Excellence',
      spacing: 'normal',
    },
    bodyText: '{{recipient_name}}\n\nhas demonstrated exceptional proficiency in\n\n{{program_name}}\n\n{{issue_date}}',
    signatures: [],
    showQrCode: true,
    showCertNumber: true,
    showExpiryDate: false,
  },
}

export function getDefaultDesignConfig(): CertificateDesignConfig {
  return {
    ...STARTER_TEMPLATES.modern,
    colors: STARTER_TEMPLATES.modern.colors!,
    fonts: STARTER_TEMPLATES.modern.fonts!,
    background: STARTER_TEMPLATES.modern.background!,
    border: STARTER_TEMPLATES.modern.border!,
    layout: STARTER_TEMPLATES.modern.layout!,
    bodyText: STARTER_TEMPLATES.modern.bodyText!,
    signatures: [],
    showQrCode: true,
    showCertNumber: true,
    showExpiryDate: false,
  }
}

export function renderMergeFields(
  template: string,
  data: {
    recipientName: string
    programName: string
    issueDate: string
    expiryDate?: string | null
    certificateNumber: string
    academyName: string
    customFields?: Record<string, string>
  }
): string {
  return template
    .replace(/\{\{recipient_name\}\}/g, data.recipientName)
    .replace(/\{\{program_name\}\}/g, data.programName)
    .replace(/\{\{issue_date\}\}/g, data.issueDate)
    .replace(/\{\{expiry_date\}\}/g, data.expiryDate || 'N/A')
    .replace(/\{\{certificate_number\}\}/g, data.certificateNumber)
    .replace(/\{\{academy_name\}\}/g, data.academyName)
}
