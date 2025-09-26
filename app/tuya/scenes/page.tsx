export default function TuyaScenesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Smart Scenes</h1>
        <p className="mt-2 text-gray-600">Create and manage automated scenes</p>
      </div>
      
      <div className="mb-6">
        <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          Create New Scene
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            name: 'Good Morning', 
            description: 'Turn on lights, start coffee maker, adjust thermostat',
            devices: 5,
            active: true
          },
          { 
            name: 'Movie Time', 
            description: 'Dim lights, close curtains, turn on TV',
            devices: 4,
            active: false
          },
          { 
            name: 'Good Night', 
            description: 'Turn off all lights, lock doors, set security',
            devices: 8,
            active: true
          },
          { 
            name: 'Away Mode', 
            description: 'Turn off unnecessary devices, activate security',
            devices: 12,
            active: false
          },
          { 
            name: 'Dinner Time', 
            description: 'Set dining room ambiance, kitchen prep mode',
            devices: 3,
            active: true
          },
          { 
            name: 'Work Mode', 
            description: 'Office lighting, focus temperature, minimize distractions',
            devices: 6,
            active: false
          }
        ].map((scene, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{scene.name}</h3>
              <span className={`w-3 h-3 rounded-full ${
                scene.active ? 'bg-green-400' : 'bg-gray-400'
              }`}></span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{scene.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{scene.devices} devices</span>
              <div className="space-x-2">
                <button className="text-red-600 hover:text-red-800 text-sm">
                  {scene.active ? 'Stop' : 'Run'}
                </button>
                <button className="text-gray-600 hover:text-gray-800 text-sm">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}