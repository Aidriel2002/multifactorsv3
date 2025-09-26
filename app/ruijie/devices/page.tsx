export default function RuijieDevicesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Network Devices</h1>
        <p className="mt-2 text-gray-600">Manage your Ruijie network infrastructure</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { name: 'Access Point 01', model: 'RG-AP730-I', status: 'online', clients: 24 },
          { name: 'Access Point 02', model: 'RG-AP630-I', status: 'online', clients: 18 },
          { name: 'Access Point 03', model: 'RG-AP730-I', status: 'offline', clients: 0 },
          { name: 'Switch Core', model: 'RG-S5750C-28GT4XS-H', status: 'online', clients: 156 },
          { name: 'Router Main', model: 'RG-EG210G-E', status: 'online', clients: 200 },
          { name: 'Access Point 04', model: 'RG-AP630-I', status: 'warning', clients: 12 }
        ].map((device, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{device.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                device.status === 'online' ? 'bg-green-100 text-green-800' :
                device.status === 'offline' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {device.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{device.model}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Connected Devices:</span>
              <span className="font-medium">{device.clients}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}