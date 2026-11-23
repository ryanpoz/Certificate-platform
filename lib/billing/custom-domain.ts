/**
 * Custom domains (Business). When an account's plan no longer includes custom
 * domains, every request on its domain is permanently redirected (301) to the
 * same path on our domain, so shared links keep working while DNS points at us.
 *
 * Fails safe: if domains can't be looked up (sql/006 not run, database down),
 * requests are served normally.
 */
import { db } from '@/lib/db'
import { academyDomains } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { BRAND } from '@/lib/config/brand'
import { can } from './entitlements'
import { getAcademyPlan } from './usage'

/** Hostnames that are ours (never treated as a customer domain) */
export function isPlatformHost(host: string, primaryUrl: string = BRAND.url): boolean {
  const h = normalizeHost(host)
  if (!h) return true
  let primary = ''
  try {
    primary = new URL(primaryUrl).hostname.toLowerCase()
  } catch {
    primary = ''
  }
  return h === primary || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.vercel.app') || h.endsWith('.localhost')
}

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? '').trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '')
}

/**
 * Where to send a request on `host`, or null to serve it normally.
 * `domainAllowed` is whether the owning account's plan includes custom domains
 * (null when the host isn't a registered customer domain).
 */
export function customDomainRedirect(input: {
  host: string
  pathAndQuery: string
  domainAllowed: boolean | null
  primaryUrl?: string
}): string | null {
  const primaryUrl = input.primaryUrl ?? BRAND.url
  if (isPlatformHost(input.host, primaryUrl)) return null
  if (input.domainAllowed !== false) return null
  const base = primaryUrl.replace(/\/+$/, '')
  const path = input.pathAndQuery.startsWith('/') ? input.pathAndQuery : `/${input.pathAndQuery}`
  return `${base}${path}`
}

const CACHE_MS = 60_000
const cache = new Map<string, { allowed: boolean | null; expires: number }>()

/** Does the plan of the account owning `host` include custom domains? null = not a customer domain / unknown */
export async function domainAllowedFor(host: string, now: number = Date.now()): Promise<boolean | null> {
  const h = normalizeHost(host)
  const hit = cache.get(h)
  if (hit && hit.expires > now) return hit.allowed
  let allowed: boolean | null = null
  try {
    const [row] = await db
      .select({ academyId: academyDomains.academyId })
      .from(academyDomains)
      .where(eq(academyDomains.hostname, h))
      .limit(1)
    allowed = row ? can(await getAcademyPlan(row.academyId), 'customDomain') : null
  } catch {
    allowed = null
  }
  cache.set(h, { allowed, expires: now + CACHE_MS })
  return allowed
}

/** For tests */
export function clearCustomDomainCache() {
  cache.clear()
}

/** Is a custom domain registered to this account (and its plan still includes it)? */
export async function academyHasActiveCustomDomain(academyId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ hostname: academyDomains.hostname })
      .from(academyDomains)
      .where(eq(academyDomains.academyId, academyId))
      .limit(1)
    return !!row
  } catch {
    return false
  }
}
