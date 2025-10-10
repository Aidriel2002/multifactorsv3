'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import { getOAuthConfig, debugOAuthConfig } from '@/app/utils/oauth-config'

interface AuthDebugInfo {
  hasSession: boolean
  hasUser: boolean
  userEmail?: string
  userProvider?: string
  profileStatus?: string
  profileRole?: string
  lastActive?: string
}

export default function OAuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo>({
    hasSession: false,
    hasUser: false
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          return
        }

        const hasSession = !!session
        const hasUser = !!session?.user
        const userEmail = session?.user?.email
        const userProvider = session?.user?.app_metadata?.provider

        let profileStatus = 'Unknown'
        let profileRole = 'Unknown'
        let lastActive = 'Unknown'

        if (hasUser && session.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('status, role, last_active')
              .eq('id', session.user.id)
              .single()

            if (profile) {
              profileStatus = profile.status || 'Unknown'
              profileRole = profile.role || 'Unknown'
              lastActive = profile.last_active || 'Unknown'
            }
          } catch (profileError) {
            console.warn('Profile fetch error:', profileError)
          }
        }

        setDebugInfo({
          hasSession,
          hasUser,
          userEmail,
          userProvider,
          profileStatus,
          profileRole,
          lastActive
        })
      } catch (error) {
        console.error('Debug check error:', error)
      }
    }

    checkAuthStatus()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      checkAuthStatus()
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show debug panel on Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible)
        debugOAuthConfig()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">OAuth Debug Panel</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div><strong>Session:</strong> {debugInfo.hasSession ? '✅' : '❌'}</div>
        <div><strong>User:</strong> {debugInfo.hasUser ? '✅' : '❌'}</div>
        {debugInfo.userEmail && (
          <div><strong>Email:</strong> {debugInfo.userEmail}</div>
        )}
        {debugInfo.userProvider && (
          <div><strong>Provider:</strong> {debugInfo.userProvider}</div>
        )}
        <div><strong>Profile Status:</strong> {debugInfo.profileStatus}</div>
        <div><strong>Profile Role:</strong> {debugInfo.profileRole}</div>
        <div><strong>Last Active:</strong> {debugInfo.lastActive}</div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-400">
          Press Ctrl+Shift+D to toggle
        </div>
      </div>
    </div>
  )
}
