import { tagCertificateUrl, type ViewSource } from './tracking'

/**
 * Share helpers for the public certificate page (pure, safe for client and server).
 */

export type ShareChannel = 'linkedin_post' | 'x' | 'facebook' | 'email' | 'copy_link' | 'copy_text'

export interface SharePostInput {
  courseName: string
  academyName: string
  certificateUrl: string
}

/** First-person post the recipient can edit before sharing */
export function buildSharePostText({ courseName, academyName, certificateUrl }: SharePostInput): string {
  return [
    `I'm proud to share that I've earned the ${courseName} certificate from ${academyName}.`,
    '',
    `You can verify it here: ${certificateUrl}`,
  ].join('\n')
}

export function buildShareLinks(params: {
  certificateUrl: string
  postText: string
  courseName: string
  academyName: string
}): Record<Exclude<ShareChannel, 'copy_link' | 'copy_text'>, string> {
  const { certificateUrl, postText, courseName, academyName } = params
  const enc = encodeURIComponent
  // Every outbound link carries a source tag so visits can be attributed
  const tagged = (source: ViewSource) => tagCertificateUrl(certificateUrl, source)
  const withTaggedUrl = (source: ViewSource) => postText.split(certificateUrl).join(tagged(source))
  return {
    // LinkedIn opens the post composer with the text prefilled
    linkedin_post: `https://www.linkedin.com/feed/?shareActive=true&text=${enc(withTaggedUrl('linkedin_post'))}`,
    x: `https://twitter.com/intent/tweet?text=${enc(`I earned the ${courseName} certificate from ${academyName}.`)}&url=${enc(tagged('x'))}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(tagged('facebook'))}`,
    email: `mailto:?subject=${enc(`My ${courseName} certificate`)}&body=${enc(withTaggedUrl('email'))}`,
  }
}

/** Display form of a verification link: host + path, no protocol or query */
export function shortVerifyLink(certificateUrl: string): string {
  try {
    const u = new URL(certificateUrl)
    return `${u.host}${u.pathname}`
  } catch {
    return certificateUrl.replace(/^https?:\/\//, '').split('?')[0]
  }
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}
