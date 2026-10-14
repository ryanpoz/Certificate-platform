import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/utils/auth'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')
  
  let isLoggedIn = false
  if (token) {
    try {
      await verifySessionToken(token.value)
      isLoggedIn = true
    } catch {
      // Not logged in
    }
  }

  return (
    <>
      <MarketingNav isLoggedIn={isLoggedIn} />
      <main>{children}</main>
      <MarketingFooter />
    </>
  )
}
