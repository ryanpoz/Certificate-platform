'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyMagicLinkAndLogin } from './actions'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setError('invalid')
      setVerifying(false)
      return
    }

    async function verify() {
      const result = await verifyMagicLinkAndLogin(token!)
      
      if (result.success) {
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(result.error || 'unknown')
        setVerifying(false)
      }
    }

    verify()
  }, [searchParams, router])

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full p-8 bg-paper rounded-card shadow">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cheer mb-4"></div>
            <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink mb-2">Verifying...</h2>
            <p className="text-ink-soft">Please wait while we log you in.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full p-8 bg-paper rounded-card shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
          <p className="text-ink-soft mb-4">This magic link is invalid or missing.</p>
          <a 
            href="/auth/login" 
            className="inline-block px-4 py-2 bg-cheer text-white rounded-btn hover:bg-cheer-hover"
          >
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full p-8 bg-paper rounded-card shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Link Expired</h2>
          <p className="text-ink-soft mb-4">This magic link has expired or has already been used.</p>
          <a 
            href="/auth/login" 
            className="inline-block px-4 py-2 bg-cheer text-white rounded-btn hover:bg-cheer-hover"
          >
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full p-8 bg-paper rounded-card shadow">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-ink-soft mb-4">An error occurred while verifying your link. Please try again.</p>
        <a 
          href="/auth/login" 
          className="inline-block px-4 py-2 bg-cheer text-white rounded-btn hover:bg-cheer-hover"
        >
          Request a new link
        </a>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full p-8 bg-paper rounded-card shadow">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cheer mb-4"></div>
            <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink mb-2">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}

