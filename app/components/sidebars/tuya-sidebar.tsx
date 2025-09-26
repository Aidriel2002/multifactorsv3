'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Smartphone, 
  Lightbulb, 
  Zap, 
  ArrowLeft 
} from 'lucide-react'
import UserProfile from '@/app/components/ui/user-profile'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/tuya/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Devices',
    href: '/tuya/devices',
    icon: Smartphone
  },
  {
    name: 'Scenes',
    href: '/tuya/scenes',
    icon: Lightbulb
  },
  {
    name: 'Automation',
    href: '/tuya/automation',
    icon: Zap
  }
]

export default function TuyaSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleBackToMain = () => {
    router.push('/multifactors/dashboard')
  }

  return (
    <div className="w-64 bg-white shadow-lg h-full border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-orange-600">Tuya Smart</h1>
            <p className="text-sm text-gray-500 mt-1">IoT Platform</p>
          </div>
          <button
            onClick={handleBackToMain}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title="Back to Main Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <nav className="mt-6 flex-1">
        <div className="px-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Tuya Menu
          </h2>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="px-4 mt-8">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <h3 className="text-sm font-medium text-orange-800 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors">
                Sync Devices
              </button>
              <button className="w-full text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors">
                Check Status
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* User Profile at the bottom */}
      <div className="p-4 border-t border-gray-200">
        <UserProfile />
      </div>
    </div>
  )
}