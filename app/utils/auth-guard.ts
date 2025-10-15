import { supabase } from '@/app/lib/supabase/client'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { forceSessionRefresh } from './session-refresh'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  status: string
  role: string
  avatar_url?: string
  last_active?: string
}

export interface AuthResult {
  isAuthenticated: boolean
  user: any
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

/**
 * Comprehensive authentication guard that checks:
 * 1. User session exists
 * 2. User email is confirmed
 * 3. User profile exists
 * 4. User account is approved
 * 5. User has appropriate role (if required)
 */
export const checkAuthentication = async (requiredRole?: string, fallbackUser?: any): Promise<AuthResult> => {
  try {
    let user: any
    let session: any = null
    
    // If we have a fallback user, use it directly
    if (fallbackUser) {
      user = fallbackUser
    } else {
      // Get current session
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      session = sessionData.session
      user = sessionData.user

      // Quick validation - no session = not authenticated
      if (sessionErr || !session || !user) {
        // Try getUser as a fallback in case getSession() is not working properly
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        
        if (userErr || !userData.user) {
          return {
            isAuthenticated: false,
            user: null,
            profile: null,
            loading: false,
            error: sessionErr?.message || 'No active session found'
          }
        }
        
        // Use the user from getUser instead
        user = userData.user
      }
    }

    // Quick session expiry check - use expires_at as seconds timestamp
    if (session && session.expires_at) {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      const expiresAt = session.expires_at // This is already in seconds
      
      if (expiresAt <= now) {
        return {
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: 'Session expired'
        }
      }
    }

    // Quick email confirmation check
    if (!user.email_confirmed_at) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: 'Email not confirmed. Please check your email and click the confirmation link.'
      }
    }

    // Get user profile (only required fields for speed)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, status, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: 'User profile not found. Please contact support.'
      }
    }

    // Check account approval (allow OAuth users to pass through)
    if (profile.status !== 'approved') {
      const isOAuthUser = user.app_metadata?.provider === 'google' || 
                         user.app_metadata?.provider === 'oauth' ||
                         user.app_metadata?.provider === 'github'
      
      if (!isOAuthUser) {
        const statusMessage = profile.status === 'rejected' 
          ? 'Your account has been rejected. Please contact support.'
          : 'Your account is pending approval. Please wait for an administrator to approve your account.'
        
        return {
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: statusMessage
        }
      }
    }

    // Check role if required
    if (requiredRole && profile.role !== requiredRole) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: `Access denied. This area requires ${requiredRole} role.`
      }
    }

    return {
      isAuthenticated: true,
      user,
      profile: {
        id: profile.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        status: profile.status,
        role: profile.role,
        avatar_url: user.user_metadata?.avatar_url,
        last_active: new Date().toISOString()
      },
      loading: false,
      error: null
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      profile: null,
      loading: false,
      error: 'An error occurred while checking authentication'
    }
  }
}

/**
 * Quick session validation without full authentication check
 * Useful for periodic checks to detect expired sessions
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }
    
    // Check if session is expired - use expires_at as seconds timestamp
    if (session.expires_at) {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      const expiresAt = session.expires_at // This is already in seconds
      if (expiresAt <= now) {
        return false
      }
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Client-side authentication hook for React components
 * NOTE: This hook is deprecated in favor of the AuthGuard component
 * to avoid conflicts with multiple auth state listeners
 */
export const useAuthGuard = (requiredRole?: string) => {
  
  const [authState, setAuthState] = useState<AuthResult>({
    isAuthenticated: false,
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const checkAuth = async () => {
      const result = await checkAuthentication(requiredRole)
      setAuthState(result)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthState({
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: 'User signed out'
        })
      } else if (event === 'SIGNED_IN' && session) {
        const result = await checkAuthentication(requiredRole)
        setAuthState(result)
      }
    })

    return () => subscription.unsubscribe()
  }, [requiredRole])

  return authState
}

/**
 * Server-side authentication check for middleware
 */
export const serverAuthCheck = async (requiredRole?: string): Promise<AuthResult> => {
  return await checkAuthentication(requiredRole)
}

/**
 * Redirect to home if not authenticated
 */
export const redirectIfNotAuthenticated = (authResult: AuthResult) => {
  if (!authResult.isAuthenticated && !authResult.loading) {
    redirect('/')
  }
}

/**
 * Get protected route configuration
 */
export const getProtectedRoutes = () => ({
  // Multifactors routes
  '/multifactors': { requiredRole: undefined },
  '/multifactors/dashboard': { requiredRole: undefined },
  '/multifactors/projects': { requiredRole: undefined },
  '/multifactors/saved-projects': { requiredRole: undefined },
  '/multifactors/quotation-list': { requiredRole: undefined },
  '/multifactors/suppliers-customers': { requiredRole: undefined },
  '/multifactors/activity-logs': { requiredRole: undefined },
  '/multifactors/account-settings': { requiredRole: undefined },
  '/multifactors/account-approval': { requiredRole: 'admin' },
  
  // Ruijie routes
  '/ruijie': { requiredRole: undefined },
  '/ruijie/dashboard': { requiredRole: undefined },
  '/ruijie/devices': { requiredRole: undefined },
  '/ruijie/network': { requiredRole: undefined },
  '/ruijie/settings': { requiredRole: undefined },
  '/ruijie/account-settings': { requiredRole: undefined },
  
  // Tuya routes
  '/tuya': { requiredRole: undefined },
  '/tuya/dashboard': { requiredRole: undefined },
  '/tuya/devices': { requiredRole: undefined },
  '/tuya/automation': { requiredRole: undefined },
  '/tuya/scenes': { requiredRole: undefined },
  '/tuya/account-settings': { requiredRole: undefined },
})

/**
 * Check if a route is protected
 */
export const isProtectedRoute = (pathname: string): { isProtected: boolean; requiredRole?: string } => {
  const protectedRoutes = getProtectedRoutes()
  
  // Check exact match first
  if (protectedRoutes[pathname as keyof typeof protectedRoutes]) {
    return {
      isProtected: true,
      requiredRole: protectedRoutes[pathname as keyof typeof protectedRoutes].requiredRole
    }
  }
  
  // Check for nested routes
  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      return {
        isProtected: true,
        requiredRole: config.requiredRole
      }
    }
  }
  
  return { isProtected: false }
}
