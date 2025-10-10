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
export const checkAuthentication = async (requiredRole?: string): Promise<AuthResult> => {
  try {
    console.log('🔍 AuthGuard - Starting authentication check...')
    
    // Get current session with retry for OAuth sessions
    let session, user, sessionError
    
    // Try to get session, with a small delay for OAuth sessions
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    session = sessionData.session
    user = sessionData.user
    sessionError = sessionErr

    console.log('🔍 AuthGuard - Initial session check:', {
      hasSession: !!session,
      hasUser: !!user,
      sessionError: sessionError?.message,
      userEmail: user?.email,
      sessionUser: session?.user,
      sessionAccessToken: !!session?.access_token,
      sessionRefreshToken: !!session?.refresh_token
    })

    // If we have a session but no user, try to get the user directly
    if (session && !user && !sessionError) {
      console.log('🔍 AuthGuard - Session exists but no user, trying to get user directly...')
      
      // Try to get user from session.user first
      if (session.user) {
        user = session.user
        console.log('🔍 AuthGuard - Got user from session.user:', session.user.email)
      } else {
        // Try to get user directly from auth
        const { data: { user: directUser }, error: userError } = await supabase.auth.getUser()
        
        if (directUser && !userError) {
          user = directUser
          console.log('🔍 AuthGuard - Got user directly:', directUser.email)
        } else {
          console.log('🔍 AuthGuard - Could not get user directly:', userError?.message)
        }
      }
    }

    // If no session found, wait a bit and try again (for OAuth race conditions)
    if (!session && !sessionError) {
      console.log('🔍 AuthGuard - No session found, waiting for OAuth session to establish...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: retrySessionData, error: retrySessionErr } = await supabase.auth.getSession()
      session = retrySessionData.session
      user = retrySessionData.user
      sessionError = retrySessionErr
      
      console.log('🔍 AuthGuard - Retry session check:', {
        hasSession: !!session,
        hasUser: !!user,
        sessionError: sessionError?.message,
        userEmail: user?.email
      })
    }

    // Final validation - we need both session and user
    if (sessionError) {
      console.log('🔍 AuthGuard - Session error:', sessionError.message)
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: `Session error: ${sessionError.message}`
      }
    }

    if (!session) {
      console.log('🔍 AuthGuard - No session found')
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: 'No active session found'
      }
    }

    if (!user) {
      console.log('🔍 AuthGuard - Session exists but no user data, trying to refresh session...')
      
      // Try to force refresh the session
      const refreshResult = await forceSessionRefresh()
      
      if (refreshResult.success && refreshResult.user) {
        console.log('🔍 AuthGuard - Session refreshed successfully, got user:', refreshResult.user.email)
        user = refreshResult.user
      } else {
        console.log('🔍 AuthGuard - Session refresh failed:', refreshResult.error)
        return {
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: 'Session exists but user data is missing and refresh failed'
        }
      }
    }

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: 'Email not confirmed. Please check your email and click the confirmation link.'
      }
    }

    // Get user profile
    console.log('🔍 AuthGuard - Fetching user profile for:', user.email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('🔍 AuthGuard - Profile check result:', {
      hasProfile: !!profile,
      profileError: profileError?.message,
      profileStatus: profile?.status,
      profileRole: profile?.role
    })

    if (profileError || !profile) {
      console.log('🔍 AuthGuard - Profile not found or error:', profileError?.message)
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        loading: false,
        error: 'User profile not found. Please contact support.'
      }
    }

    // Check if account is approved (but allow OAuth users to pass through)
    if (profile.status !== 'approved') {
      // For OAuth users, allow them to pass through even if status is not approved
      // This handles cases where OAuth users are auto-approved
      const isOAuthUser = user.app_metadata?.provider === 'google' || user.app_metadata?.provider === 'oauth'
      
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

    console.log('🔍 AuthGuard - Authentication successful!', {
      userEmail: user.email,
      profileStatus: profile.status,
      profileRole: profile.role,
      requiredRole
    })

    return {
      isAuthenticated: true,
      user,
      profile,
      loading: false,
      error: null
    }
  } catch (error) {
    console.error('Authentication check error:', error)
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
 * Client-side authentication hook for React components
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
          error: 'Session expired'
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
