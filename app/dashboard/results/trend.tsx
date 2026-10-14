export default function ResultsTrend({ trendData }: { trendData: Array<{ date: string; issued: number; viewed: number }> }) {
  if (trendData.length === 0) {
    return null
  }

  return (
    <div className="mt-8 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Trend Over Time</h2>
        <div className="text-sm text-gray-500 mb-4">
          Daily certificate issuance and views
        </div>
        <div className="h-64 flex items-end justify-between space-x-1">
          {trendData.map((point, i) => {
            const maxIssued = Math.max(...trendData.map(p => p.issued), 1)
            const issuedHeight = (point.issued / maxIssued) * 100
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center" title={point.date}>
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${issuedHeight}%` }}
                />
                {i % Math.ceil(trendData.length / 7) === 0 && (
                  <div className="text-xs text-gray-500 mt-2 rotate-45 origin-top-left">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
