import { type CertificateDesignConfig, STARTER_TEMPLATES as BASE_TEMPLATES, getDefaultDesignConfig } from './types'

export const STARTER_TEMPLATES: Array<{
  id: string
  name: string
  description: string
  preview: string
  config: CertificateDesignConfig
}> = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines with contemporary typography',
    preview: '/templates/modern.png',
    config: getDefaultDesignConfig(),
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional serif fonts with elegant borders',
    preview: '/templates/classic.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.classic,
      colors: BASE_TEMPLATES.classic.colors!,
      fonts: BASE_TEMPLATES.classic.fonts!,
      background: BASE_TEMPLATES.classic.background!,
      border: BASE_TEMPLATES.classic.border!,
      layout: BASE_TEMPLATES.classic.layout!,
      bodyText: BASE_TEMPLATES.classic.bodyText!,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean with plenty of white space',
    preview: '/templates/minimal.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.minimal,
      colors: BASE_TEMPLATES.minimal.colors!,
      fonts: BASE_TEMPLATES.minimal.fonts!,
      background: BASE_TEMPLATES.minimal.background!,
      border: BASE_TEMPLATES.minimal.border!,
      layout: BASE_TEMPLATES.minimal.layout!,
      bodyText: BASE_TEMPLATES.minimal.bodyText!,
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-contrast colors and strong typography',
    preview: '/templates/bold.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.bold,
      colors: BASE_TEMPLATES.bold.colors!,
      fonts: BASE_TEMPLATES.bold.fonts!,
      background: BASE_TEMPLATES.bold.background!,
      border: BASE_TEMPLATES.bold.border!,
      layout: BASE_TEMPLATES.bold.layout!,
      bodyText: BASE_TEMPLATES.bold.bodyText!,
    },
  },
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    description: 'Sophisticated with gold accents',
    preview: '/templates/elegant-gold.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.classic,
      colors: {
        primary: '#92400e',
        accent: '#d97706',
        background: '#fffbeb',
        text: '#292524',
      },
      fonts: BASE_TEMPLATES.classic.fonts!,
      background: { type: 'color' as const, value: '#fffbeb' },
      border: { style: 'double' as const, color: '#92400e', width: 8 },
      layout: BASE_TEMPLATES.classic.layout!,
      bodyText: BASE_TEMPLATES.classic.bodyText!,
    },
  },
  {
    id: 'professional-blue',
    name: 'Professional',
    description: 'Corporate style with blue tones',
    preview: '/templates/professional.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#1e40af',
        accent: '#3b82f6',
        background: '#f8fafc',
        text: '#1e293b',
      },
    },
  },
  {
    id: 'creative-purple',
    name: 'Creative',
    description: 'Vibrant purple with playful design',
    preview: '/templates/creative.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#7c3aed',
        accent: '#a78bfa',
        background: '#faf5ff',
        text: '#581c87',
      },
      background: {
        type: 'pattern',
        value: 'dots',
      },
    },
  },
  {
    id: 'badge-red',
    name: 'Badge',
    description: 'Circular badge design for achievements',
    preview: '/templates/badge.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#dc2626',
        accent: '#f59e0b',
        background: '#fffbeb',
        text: '#7c2d12',
      },
      border: {
        style: 'ornamental',
        color: '#dc2626',
        width: 6,
      },
    },
  },
  {
    id: 'tech-cyan',
    name: 'Tech',
    description: 'Modern tech style with cyan',
    preview: '/templates/tech.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#0891b2',
        accent: '#06b6d4',
        background: '#f0fdfa',
        text: '#134e4a',
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Open Sans',
        pair: 'montserrat-opensans',
      },
    },
  },
  {
    id: 'academic-red',
    name: 'Academic',
    description: 'Traditional university style',
    preview: '/templates/academic.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.classic,
      colors: {
        primary: '#7f1d1d',
        accent: '#b91c1c',
        background: '#fef2f2',
        text: '#450a0a',
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Lato',
        pair: 'playfair-lato',
      },
      background: { type: 'color' as const, value: '#fef2f2' },
      border: { style: 'double' as const, color: '#7f1d1d', width: 10 },
      layout: BASE_TEMPLATES.classic.layout!,
      bodyText: BASE_TEMPLATES.classic.bodyText!,
    },
  },
  {
    id: 'pastel-pink',
    name: 'Pastel',
    description: 'Soft colors for a friendly feel',
    preview: '/templates/pastel.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#db2777',
        accent: '#ec4899',
        background: '#fdf4ff',
        text: '#701a75',
      },
    },
  },
  {
    id: 'corporate-gray',
    name: 'Corporate',
    description: 'Professional gray for business',
    preview: '/templates/corporate.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.minimal,
      colors: {
        primary: '#334155',
        accent: '#475569',
        background: '#f8fafc',
        text: '#0f172a',
      },
      fonts: BASE_TEMPLATES.minimal.fonts!,
      background: { type: 'color' as const, value: '#f8fafc' },
      border: BASE_TEMPLATES.minimal.border!,
      layout: BASE_TEMPLATES.minimal.layout!,
      bodyText: BASE_TEMPLATES.minimal.bodyText!,
    },
  },
  {
    id: 'luxury-dark',
    name: 'Luxury',
    description: 'Premium dark background with gold',
    preview: '/templates/luxury.png',
    config: {
      ...getDefaultDesignConfig(),
      ...BASE_TEMPLATES.classic,
      colors: {
        primary: '#fbbf24',
        accent: '#fcd34d',
        background: '#18181b',
        text: '#fef3c7',
      },
      fonts: BASE_TEMPLATES.classic.fonts!,
      background: { type: 'color' as const, value: '#18181b' },
      border: { style: 'double' as const, color: '#fbbf24', width: 6 },
      layout: BASE_TEMPLATES.classic.layout!,
      bodyText: BASE_TEMPLATES.classic.bodyText!,
    },
  },
  {
    id: 'wellness-green',
    name: 'Wellness',
    description: 'Calm natural tones for health programs',
    preview: '/templates/wellness.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#059669',
        accent: '#34d399',
        background: '#f0fdf4',
        text: '#064e3b',
      },
    },
  },
  {
    id: 'achievement-yellow',
    name: 'Achievement',
    description: 'Celebratory design with gold',
    preview: '/templates/achievement.png',
    config: {
      ...getDefaultDesignConfig(),
      colors: {
        primary: '#ca8a04',
        accent: '#fde047',
        background: '#fffbeb',
        text: '#713f12',
      },
      border: {
        style: 'ornamental',
        color: '#ca8a04',
        width: 5,
      },
    },
  },
]

export function getStarterTemplate(id: string) {
  return STARTER_TEMPLATES.find(t => t.id === id)
}
