export default function TuyaAutomationPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
        <p className="mt-2 text-gray-600">Set up intelligent automation for your devices</p>
      </div>
      
      <div className="mb-6">
        <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          Create New Automation
        </button>
      </div>
      
      <div className="space-y-6">
        {[
          {
            name: 'Motion-Activated Lighting',
            trigger: 'Motion detected in hallway',
            action: 'Turn on hallway lights',
            status: 'active',
            lastTriggered: '2 hours ago'
          },
          {
            name: 'Energy Saving Mode',
            trigger: 'No motion for 30 minutes',
            action: 'Turn off non-essential devices',
            status: 'active',
            lastTriggered: '1 day ago'
          },
          {
            name: 'Security Alert',
            trigger: 'Door/window opened after 10 PM',
            action: 'Send notification, turn on cameras',
            status: 'active',
            lastTriggered: 'Never'
          },
          {
            name: 'Temperature Control',
            trigger: 'Temperature above 26°C',
            action: 'Turn on AC, close curtains',
            status: 'paused',
            lastTriggered: '3 hours ago'
          },
          {
            name: 'Morning Routine',
            trigger: 'Weekdays at 7:00 AM',
            action: 'Run Good Morning scene',
            status: 'active',
            lastTriggered: 'Today at 7:00 AM'
          }
        ].map((automation, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                  automation.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {automation.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="text-red-600 hover:text-red-800 text-sm">
                  {automation.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button className="text-gray-600 hover:text-gray-800 text-sm">
                  Edit
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">When:</h4>
                <p className="text-sm text-gray-600">{automation.trigger}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Then:</h4>
                <p className="text-sm text-gray-600">{automation.action}</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Last triggered: {automation.lastTriggered}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}