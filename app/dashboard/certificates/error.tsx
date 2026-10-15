'use client'

export default function CertificatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Certificates page error:', error)

  return (
    <div className="px-4 sm:px-0">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to load certificates</h2>
        <p className="text-sm text-red-700 mb-4">
          {error.message || 'An error occurred while loading certificates.'}
        </p>
        {error.digest && (
          <p className="text-xs text-red-600 mb-4">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
