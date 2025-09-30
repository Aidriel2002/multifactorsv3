'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderOpen, 
  BookmarkCheck, 
  Users, 
  UserCheck, 
  Wifi, 
  Home, 
  Menu,
  X
} from 'lucide-react'
import { ListOrdered } from 'lucide-react'
import { ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import UserProfile from '@/app/components/ui/user-profile'

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
  isExternal?: boolean
}

const baseMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/multifactors/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Projects',
    href: '/multifactors/projects',
    icon: FolderOpen
  },
  {
    name: 'Saved Projects',
    href: '/multifactors/saved-projects',
    icon: BookmarkCheck
  },
  {
    name: 'Suppliers & Customers',
    href: '/multifactors/suppliers-customers',
    icon: Users
  },
  {
    name: 'Purchased Order',
    href: '/multifactors/purchased-order',
    icon: ShoppingCart
  },
  {
    name: 'Activity Logs',
    href: '/multifactors/activity-logs',
    icon: ListOrdered
  }
]

const integrationItems: MenuItem[] = [
  {
    name: 'Ruijie Reyee',
    href: '/ruijie/dashboard',
    icon: Wifi,
    isExternal: true
  },
  {
    name: 'Tuya',
    href: '/tuya/dashboard',
    icon: Home,
    isExternal: true
  }
]

export default function MultiSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const [menuItems, setMenuItems] = useState<MenuItem[]>(baseMenuItems)
  const [userData, setUserData] = useState<{ name: string; email: string; role: string } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error.message)
      }

      const role = profile?.role || user?.user_metadata?.role || "user"

      setUserData({
        name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User",
        email: user.email || "",  
        role
      })

      if (role === "admin") {
        setMenuItems([
          ...baseMenuItems,
          {
            name: 'Account Approval',
            href: '/multifactors/account-approval',
            icon: UserCheck
          }
        ])
      }
    }

    fetchUserRole()
  }, [])

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false) 
  }

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 p-2 rounded-md z-66 bg-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        className={`
          fixed md:static inset-y-0 left-0 w-64 bg-white shadow-lg h-full border-r z-50 border-gray-200 flex flex-col
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Multifactors Sales</h1>
          <p className="text-sm text-gray-500 mt-1">Main Dashboard</p>
        </div>
        
        <nav className="mt-6 flex-1 overflow-y-auto">
          <div className="px-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Main Menu
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
                          ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
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
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Integrations
            </h2>
            <ul className="space-y-2">
              {integrationItems.map((item) => {
                const Icon = item.icon
                
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                      <span className="ml-auto text-xs text-gray-400">→</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <UserProfile />
        </div>
      </div>
    </>
  )
}
