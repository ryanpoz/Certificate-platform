import { BRAND } from '@/lib/config/brand'
import Link from 'next/link'
import SignupForm from './form'

export const metadata = {
  title: `Sign up - ${BRAND.name}`,
  description: 'Start issuing certificates for free',
}

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Start free
            </h1>
            <p className="text-gray-600">
              250 certificates per year, no credit card required
            </p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
