/**
 * Environment validation utilities
 * Handles different environments (development, preview, production)
 */

const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
  
  // Auth
  JWT_SECRET: 'Secret for signing JWT tokens',
  
  // App URL
  NEXT_PUBLIC_APP_URL: 'Public URL of the application',
  
  // Email (optional in preview)
  RESEND_API_KEY: 'Resend API key for sending emails',
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: 'Google OAuth client ID',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret',
  
  // Supabase (optional)
  SUPABASE_URL: 'Supabase project URL',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key for storage',
} as const

type EnvVar = keyof typeof REQUIRED_ENV_VARS

const CRITICAL_ENV_VARS: EnvVar[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_APP_URL',
]

const OPTIONAL_ENV_VARS: EnvVar[] = [
  'RESEND_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === 'preview'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production'
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check environment variables at build time
 * Preview builds: warn only
 * Production builds: error for critical vars, warn for optional
 */
export function checkEnvAtBuildTime() {
  if (typeof window !== 'undefined') {
    return // Only run on server
  }

  const missing: { var: string; description: string; critical: boolean }[] = []

  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    if (!process.env[key]) {
      const isCritical = CRITICAL_ENV_VARS.includes(key as EnvVar)
      missing.push({ var: key, description, critical: isCritical })
    }
  })

  if (missing.length === 0) {
    return
  }

  const criticalMissing = missing.filter(m => m.critical)
  const optionalMissing = missing.filter(m => !m.critical)

  if (isVercelPreview()) {
    // Preview: warn only, don't fail build
    if (criticalMissing.length > 0) {
      console.warn('⚠️  Vercel Preview: Missing critical environment variables (functionality will be limited):')
      criticalMissing.forEach(({ var: varName, description }) => {
        console.warn(`   - ${varName}: ${description}`)
      })
    }
    if (optionalMissing.length > 0) {
      console.warn('ℹ️  Vercel Preview: Missing optional environment variables:')
      optionalMissing.forEach(({ var: varName, description }) => {
        console.warn(`   - ${varName}: ${description}`)
      })
    }
    return
  }

  if (isProduction() && criticalMissing.length > 0) {
    // Production: fail for critical vars
    console.error('❌ Missing critical environment variables for production:')
    criticalMissing.forEach(({ var: varName, description }) => {
      console.error(`   - ${varName}: ${description}`)
    })
    throw new Error('Missing critical environment variables. Cannot build for production.')
  }

  if (optionalMissing.length > 0) {
    console.warn('⚠️  Missing optional environment variables (some features disabled):')
    optionalMissing.forEach(({ var: varName, description }) => {
      console.warn(`   - ${varName}: ${description}`)
    })
  }
}

/**
 * Get an environment variable with runtime validation
 * Preview/Development: return fallback or empty string
 * Production: throw error if missing and critical
 */
export function getEnvVar(key: EnvVar, fallback?: string): string {
  const value = process.env[key]
  
  if (value) {
    return value
  }

  const isCritical = CRITICAL_ENV_VARS.includes(key)

  if (isProduction() && isCritical) {
    throw new Error(
      `Missing critical environment variable: ${key}\n` +
      `Description: ${REQUIRED_ENV_VARS[key]}\n` +
      `This is required for production. Please add it to your Vercel project settings.`
    )
  }

  if (isVercelPreview() || isDevelopment()) {
    // In preview/dev, return fallback or log warning
    if (!fallback) {
      console.warn(`Missing ${key} in ${isVercelPreview() ? 'preview' : 'development'}. Feature may be unavailable.`)
    }
    return fallback || ''
  }

  return fallback || ''
}

/**
 * Check if an optional feature is available
 */
export function isFeatureAvailable(feature: 'email' | 'google-oauth' | 'supabase-storage'): boolean {
  switch (feature) {
    case 'email':
      return !!process.env.RESEND_API_KEY
    case 'google-oauth':
      return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
    case 'supabase-storage':
      return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
    default:
      return false
  }
}

// Run build-time check when this module is imported
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  checkEnvAtBuildTime()
}
