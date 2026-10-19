import { requireAuth } from '@/lib/utils/session'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function logout() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/auth/login')
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  
  const [academy] = await db
    .select()
    .from(academies)
    .where(eq(academies.id, user.academyId))
    .limit(1)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/dashboard/certificates" className="flex items-center px-2 text-xl font-bold text-gray-900">
                {academy?.name || 'Certificate Platform'}
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard/certificates"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Certificates
                </Link>
                <Link
                  href="/dashboard/results"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Results
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
