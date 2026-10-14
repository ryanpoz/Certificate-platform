export default function ResultsMetrics({
  issued,
  emailDelivered,
  uniqueViews,
  linkedinClicks,
  ctaClicks,
  deliveryRate,
  viewRate,
  linkedinRate,
  ctaRate,
}: {
  issued: number
  emailDelivered: number
  uniqueViews: number
  linkedinClicks: number
  ctaClicks: number
  deliveryRate: string
  viewRate: string
  linkedinRate: string
  ctaRate: string
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Funnel Overview</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{issued}</div>
              <div className="text-sm text-blue-800">Issued</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{emailDelivered}</div>
              <div className="text-sm text-green-800">Delivered</div>
              <div className="text-xs text-green-600 mt-1">{deliveryRate}%</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{uniqueViews}</div>
              <div className="text-sm text-purple-800">Unique Views</div>
              <div className="text-xs text-purple-600 mt-1">{viewRate}%</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{linkedinClicks}</div>
              <div className="text-sm text-indigo-800">LinkedIn Clicks</div>
              <div className="text-xs text-indigo-600 mt-1">{linkedinRate}%</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{ctaClicks}</div>
              <div className="text-sm text-pink-800">CTA Clicks</div>
              <div className="text-xs text-pink-600 mt-1">{ctaRate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> LinkedIn button clicks are tracked, but profile adds and post impressions are not available from LinkedIn's API.
          Conversion rates show percentage of previous stage (e.g., views from delivered emails).
        </p>
      </div>
    </div>
  )
}
