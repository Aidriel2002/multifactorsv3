'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase/client'
import Image from "next/image"
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronUp, 
  Bell,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react'

interface UserProfileProps {
  sidebarColor?: 'green' | 'blue' | 'orange'
  showExtendedOptions?: boolean
  onUserDataChange?: (userData: UserData | null) => void
}

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string
  phone?: string
  address?: string
  role?: string
  status?: string
}

export default function UserProfile({ 
  sidebarColor = 'green',
  showExtendedOptions = false,
  onUserDataChange
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        return
      }

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()

      if (profileError) {
        if ('code' in profileError && profileError.code !== 'PGRST116') {
          console.error("Profile error:", profileError.message ?? profileError)
        }
      }

      const newUserData: UserData = {
        id: user.id,
        email: user.email || '',
        firstName: profile?.first_name || 'User',
        lastName: profile?.last_name || '',
        avatarUrl: profile?.avatar_url || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        role: profile?.role || 'staff',
        status: profile?.status || 'pending'
      }

      setUserData(newUserData)
      
      // Notify parent component about user data changes
      if (onUserDataChange) {
        onUserDataChange(newUserData)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccountSettings = () => {
    setIsOpen(false)
    let route = '/multifactors/account-settings'
    
    if (sidebarColor === 'blue') {
      route = '/ruijie/account-settings'
    } else if (sidebarColor === 'orange') {
      route = '/tuya/account-settings'
    }
    
    router.push(route)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleNotifications = () => {
    setIsOpen(false)
    console.log('Opening notifications...')
  }

  const handleHelp = () => {
    setIsOpen(false)
    console.log('Opening help...')
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const getColorClasses = () => {
    switch (sidebarColor) {
      case 'blue':
        return {
          gradient: 'from-gray-500 to-white-600',
          hover: 'hover:bg-white-50',
          text: 'text-white-600',
          ring: 'ring-white-500',
          bg: 'bg-gray-200'
        }
      case 'orange':
        return {
          gradient: 'from-gray-500 to-white-600',
          hover: 'hover:bg-white-50',
          text: 'text-white-600',
          ring: 'ring-white-500',
          bg: 'bg-gray-200'
        }
      default:
        return {
          gradient: 'from-gray-500 to-white-600',
          hover: 'hover:bg-white-50',
          text: 'text-white-600',
          ring: 'ring-white-500',
          bg: 'bg-gray-200'
        }
    }
  }

  const colorClasses = getColorClasses()

  if (loading) {
    return (
      <div className="w-full p-3">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const displayName = userData 
    ? `${userData.firstName} ${userData.lastName}`.trim() || 'User'
    : 'Loading...'

  const displayEmail = userData?.email || 'loading...'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full group flex items-center p-3 rounded-xl transition-all duration-200 ${colorClasses.hover} hover:shadow-sm border border-transparent hover:border-gray-100`}
      >
        <div className="relative flex-shrink-0">
          {userData?.avatarUrl ? (
            <Image
  src={userData.avatarUrl}
  alt={displayName}
  width={40}   
  height={40}  
  className="rounded-full object-cover ring-2 ring-white shadow-sm"
/>
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center text-white shadow-sm ring-2 ring-white`}>
              <User className="w-5 h-5" />
            </div>
          )}
          
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="ml-3 flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-800">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate group-hover:text-gray-600">
            {displayEmail}
          </p>
        </div>
        
        <ChevronUp 
          className={`w-4 h-4 text-gray-400 transition-all duration-200 group-hover:text-gray-600 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-3 border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-sm bg-white/95 transform origin-bottom animate-in slide-in-from-bottom-2">
          <div className="py-2">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center">
                <div className="relative flex-shrink-0">
                  {userData?.avatarUrl ? (
                    <Image
  src={userData.avatarUrl}
  alt={displayName}
  width={48}  
  height={48} 
  className="rounded-full object-cover ring-2 ring-white shadow-sm"
/>
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center text-white shadow-sm ring-2 ring-white`}>
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                  </p>
                 
                  {userData?.role && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                      {userData.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={handleAccountSettings}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className={`p-1.5 rounded-lg ${colorClasses.bg} bg-opacity-10 mr-3 group-hover:bg-opacity-20 transition-all`}>
                  <Settings className={`w-4 h-4 ${colorClasses.text}`} />
                </div>
                <span className="font-medium">Account Settings</span>
              </button>

              {showExtendedOptions && (
                <>
                  <button
                    onClick={handleNotifications}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-100 mr-3 group-hover:bg-purple-200 transition-all">
                      <Bell className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Notifications</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-yellow-100 mr-3 group-hover:bg-yellow-200 transition-all">
                      {isDarkMode ? (
                        <Sun className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Moon className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <span className="font-medium">
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>

                  <button
                    onClick={handleHelp}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-green-100 mr-3 group-hover:bg-green-200 transition-all">
                      <HelpCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium">Help & Support</span>
                  </button>
                </>
              )}
            </div>
            
            <hr className="my-2 border-gray-100" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group rounded-b-2xl"
            >
              <div className="p-1.5 rounded-lg bg-red-100 mr-3 group-hover:bg-red-200 transition-all">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}