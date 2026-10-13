import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Certificate Platform
          </h1>
          <p className="text-gray-600 mb-8">
            Academy credentials and certification management
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
