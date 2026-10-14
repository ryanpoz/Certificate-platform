import { formatDate } from '@/lib/utils/helpers'

export default function EventTimeline({ events }: { events: any[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h2>
          <p className="text-sm text-gray-500">No events recorded yet.</p>
        </div>
      </div>
    )
  }

  const eventLabels: Record<string, { label: string; color: string }> = {
    email_delivered: { label: 'Email Delivered', color: 'text-green-600' },
    email_bounced: { label: 'Email Bounced', color: 'text-red-600' },
    page_view: { label: 'Page Viewed', color: 'text-blue-600' },
    pdf_download: { label: 'PDF Downloaded', color: 'text-purple-600' },
    linkedin_add_click: { label: 'LinkedIn Clicked', color: 'text-blue-700' },
    cta_click: { label: 'CTA Clicked', color: 'text-purple-700' },
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h2>
        <div className="flow-root">
          <ul className="-mb-8">
            {events.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== events.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        event.isBot ? 'bg-gray-400' : 'bg-blue-500'
                      }`}>
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className={`text-sm ${eventLabels[event.type]?.color || 'text-gray-900'}`}>
                          {eventLabels[event.type]?.label || event.type}
                          {event.isBot && <span className="text-gray-500 ml-2">(Bot)</span>}
                        </p>
                        {event.referrer && (
                          <p className="text-xs text-gray-500 mt-1">
                            From: {new URL(event.referrer).hostname}
                          </p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        <time dateTime={event.at.toISOString()}>
                          {formatDate(event.at)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
