export default function RuijieSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Network Settings</h1>
        <p className="mt-2 text-gray-600">Configure your Ruijie network parameters</p>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Wireless Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network Name (SSID)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue="Company_WiFi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>WPA3-Personal</option>
                <option>WPA2-Personal</option>
                <option>WPA2-Enterprise</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Band Steering</span>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
                Enabled
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Load Balancing</span>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
                Enabled
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Auto Channel Selection</span>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                Disabled
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}