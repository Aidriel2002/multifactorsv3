export default function TuyaDevicesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Smart Devices</h1>
        <p className="mt-2 text-gray-600">Manage your Tuya IoT devices</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[
          { name: 'Living Room Light', type: 'Smart Bulb', status: 'on', room: 'Living Room' },
          { name: 'Bedroom AC', type: 'Air Conditioner', status: 'off', room: 'Bedroom' },
          { name: 'Kitchen Camera', type: 'Security Camera', status: 'on', room: 'Kitchen' },
          { name: 'Front Door Lock', type: 'Smart Lock', status: 'locked', room: 'Entrance' },
          { name: 'Garden Sprinkler', type: 'Water Controller', status: 'off', room: 'Garden' },
          { name: 'Thermostat', type: 'Climate Control', status: 'auto', room: 'Hallway' },
          { name: 'Motion Sensor', type: 'PIR Sensor', status: 'on', room: 'Hallway' },
          { name: 'Smart Plug 1', type: 'Power Outlet', status: 'on', room: 'Office' }
        ].map((device, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">{device.name}</h3>
              <span className={`w-3 h-3 rounded-full ${
                device.status === 'on' || device.status === 'locked' || device.status === 'auto' 
                  ? 'bg-green-400' 
                  : 'bg-gray-400'
              }`}></span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{device.type}</p>
            <p className="text-xs text-gray-500 mb-3">{device.room}</p>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 text-xs rounded-full ${
                device.status === 'on' ? 'bg-green-100 text-green-800' :
                device.status === 'off' ? 'bg-gray-100 text-gray-800' :
                device.status === 'locked' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {device.status}
              </span>
              <button className="text-red-600 hover:text-red-800 text-xs">
                Control
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}