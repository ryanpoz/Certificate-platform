'use client'

import { useEffect, useState } from 'react'
import { signupAction } from './actions'
import { BRAND } from '@/lib/config/brand'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { REF_COOKIE, REF_COOKIE_MAX_AGE, normalizeRef } from '@/lib/growth/tracking'

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    academyName: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certRef, setCertRef] = useState<string | null>(null)

  // Signup attribution: remember the certificate that sent this visitor (?ref=...)
  useEffect(() => {
    const ref = normalizeRef(new URLSearchParams(window.location.search).get('ref'))
    if (ref) {
      setCertRef(ref)
      document.cookie = `${REF_COOKIE}=${ref}; Max-Age=${REF_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signupAction({ ...formData, certRef })
      
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(true)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasGoogleOAuth = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true'

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-valid" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ink mb-2">Check your email</h3>
        <p className="text-ink-soft">
          We sent a magic link to <strong>{formData.email}</strong>
        </p>
        <p className="text-sm text-muted mt-2">
          Click the link in the email to complete your signup and access your dashboard.
        </p>
      </div>
    )
  }

  return (
    <>
      {hasGoogleOAuth && (
        <>
          <GoogleSignInButton />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rule-strong"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-paper text-muted">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <p>{error}</p>
            {error.includes('Google') && hasGoogleOAuth && (
              <button
                onClick={() => window.location.href = '/auth/google'}
                className="mt-2 text-sm font-medium text-stamp hover:text-stamp-hover underline"
              >
                Try Google sign-in →
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-soft mb-1">
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="field"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-soft mb-1">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="field"
            placeholder="jane@company.com"
          />
        </div>

        <div>
          <label htmlFor="academyName" className="block text-sm font-medium text-ink-soft mb-1">
            Organisation name
          </label>
          <input
            id="academyName"
            type="text"
            required
            value={formData.academyName}
            onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
            className="field"
            placeholder="Acme Training"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Start free'}
        </button>

        <p className="text-xs text-center text-muted">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-stamp hover:underline">Terms</a> and{' '}
          <a href="/privacy" className="text-stamp hover:underline">Privacy Policy</a>
        </p>
      </form>
    </>
  )
}
