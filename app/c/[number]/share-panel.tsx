'use client'

import { useState } from 'react'
import { buildShareLinks, type ShareChannel } from '@/lib/growth/share'
import { tagCertificateUrl } from '@/lib/growth/tracking'

interface SharePanelProps {
  certificateUrl: string
  postText: string
  courseName: string
  academyName: string
  onShare: (channel: ShareChannel) => void
  compact?: boolean
  /** Limit to some channels, e.g. when LinkedIn already has its own primary button */
  channels?: Array<'linkedin_post' | 'x' | 'facebook' | 'email'>
}

const channelLabels: Record<'linkedin_post' | 'x' | 'facebook' | 'email', string> = {
  linkedin_post: 'LinkedIn post',
  x: 'X',
  facebook: 'Facebook',
  email: 'Email',
}

export default function SharePanel({ certificateUrl, postText, courseName, academyName, onShare, compact, channels }: SharePanelProps) {
  const [copied, setCopied] = useState<'link' | null>(null)
  const links = buildShareLinks({ certificateUrl, postText, courseName, academyName })

  async function copyLink() {
    await navigator.clipboard.writeText(tagCertificateUrl(certificateUrl, 'copy'))
    onShare('copy_link')
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-1'}`}>
      {(channels ?? (Object.keys(channelLabels) as Array<keyof typeof channelLabels>)).map((channel) => (
        <a
          key={channel}
          href={links[channel]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShare(channel)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        >
          {channelLabels[channel]}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      >
        {copied === 'link' ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  )
}
