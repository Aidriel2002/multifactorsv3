export default function RuijieNetworkPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Network Overview</h1>
        <p className="mt-2 text-gray-600">Monitor network performance and topology</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Network Topology</h2>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Network topology visualization would appear here</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Bandwidth</span>
              <span className="font-semibold">1 Gbps</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Usage</span>
              <span className="font-semibold">2.3 GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Peak Usage Today</span>
              <span className="font-semibold">4.7 GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Latency</span>
              <span className="font-semibold">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}