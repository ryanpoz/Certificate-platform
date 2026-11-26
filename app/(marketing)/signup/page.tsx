import { BRAND } from '@/lib/config/brand'
import Link from 'next/link'
import SignupForm from './form'

export const metadata = {
  title: `Sign up - ${BRAND.name}`,
  description: 'Start issuing certificates for free',
}

export default function SignupPage() {
  return (
    <div className="band-ink flex min-h-[80vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="rounded-[20px] bg-white p-8 text-ink shadow-sticker">
          <div className="text-center mb-8">
            <h1 className="mb-2 font-display text-[40px] font-extrabold leading-none tracking-[-0.04em] text-ink">
              Start free
            </h1>
            <p className="text-ink-soft">
              250 certificates per year, no credit card required
            </p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-soft">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-cheer hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
