import { NextResponse, type NextRequest } from 'next/server'
import { customDomainRedirect, domainAllowedFor, isPlatformHost } from '@/lib/billing/custom-domain'

/**
 * Custom-domain redirect: a request on a customer's custom domain whose plan
 * no longer includes custom domains gets a 301 to the same path on our domain.
 * Our own hosts are passed straight through without any lookup.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  if (isPlatformHost(host)) return NextResponse.next()

  const target = customDomainRedirect({
    host,
    pathAndQuery: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    domainAllowed: await domainAllowedFor(host),
  })
  return target ? NextResponse.redirect(target, 301) : NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
