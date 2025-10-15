'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/app/lib/supabase/client'
import { checkAuthentication, AuthResult } from '@/app/utils/auth-guard'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
  fallback?: React.ReactNode
}

export default function AuthGuard({ 
  children, 
  requiredRole, 
  fallback 
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [authState, setAuthState] = useState<AuthResult>({
    isAuthenticated: false,
    user: null,
    profile: null,
    loading: true,
    error: null
  })
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const mountedRef = useRef(true)
  const authCheckInProgress = useRef(false)

  // Check if we're on a login/auth page to avoid interference
  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/'

  // Fast auth check function with minimal retry logic
  const performAuthCheck = useCallback(async (retryCount = 0) => {
    if (!mountedRef.current || authCheckInProgress.current) return
    
    authCheckInProgress.current = true
    
    try {
      const result = await checkAuthentication(requiredRole)
      
      if (!mountedRef.current) return
      
      setAuthState(result)
      
      // Single retry for session/profile issues only
      if (!result.isAuthenticated && !result.loading && retryCount === 0 && 
          result.error?.includes('No active session')) {
        authCheckInProgress.current = false
        setTimeout(() => {
          if (mountedRef.current) {
            performAuthCheck(1)
          }
        }, 500) // Reduced delay
        return
      }
      
      // Set redirect flag if not authenticated
      if (!result.isAuthenticated && !result.loading) {
        setShouldRedirect(true)
      } else {
        setShouldRedirect(false)
      }
    } catch (error) {
      if (mountedRef.current) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: 'Authentication check failed'
        })
        setShouldRedirect(true)
      }
    } finally {
      authCheckInProgress.current = false
    }
  }, [requiredRole])

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (!mountedRef.current) return
    
    switch (event) {
      case 'SIGNED_OUT':
        setAuthState({
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: 'Session expired'
        })
        setShouldRedirect(true)
        break
        
      case 'SIGNED_IN':
      case 'INITIAL_SESSION':
        if (session) {
          // Immediate check without delay
          performAuthCheck()
        }
        break
        
      case 'TOKEN_REFRESHED':
        // No action needed
        break
    }
  }, [performAuthCheck])

  // Main effect for auth setup
  useEffect(() => {
    mountedRef.current = true
    
    // Don't run auth checks on auth pages
    if (isAuthPage) {
      return
    }
    
    // Immediate auth check
    performAuthCheck()
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [requiredRole, isAuthPage, performAuthCheck, handleAuthStateChange, pathname])

  // Handle redirect
  useEffect(() => {
    if (shouldRedirect && !authState.loading) {
      router.push('/')
    }
  }, [shouldRedirect, authState.loading, router])

  // If we're on an auth page, just render children without any auth checks
  if (isAuthPage) {
    return <>{children}</>
  }

  // Show loading state
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show error message if not authenticated (while redirect is happening)
  if (!authState.isAuthenticated && authState.error && shouldRedirect) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{authState.error}</p>
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto" />
            <p className="text-red-600 text-sm mt-2">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error message if not authenticated but not redirecting yet
  if (!authState.isAuthenticated && authState.error && !shouldRedirect) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 mb-4">{authState.error}</p>
            <Loader2 className="h-8 w-8 animate-spin text-yellow-600 mx-auto" />
            <p className="text-yellow-600 text-sm mt-2">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show custom fallback if provided and not authenticated
  if (fallback && !authState.isAuthenticated) {
    return <>{fallback}</>
  }

  // Render children only if authenticated
  if (authState.isAuthenticated && authState.user) {
    return <>{children}</>
  }

  // Default: show checking message (not loading, waiting for auth to resolve)
  if (!shouldRedirect) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Redirecting...</p>
      </div>
    </div>
  )
}
