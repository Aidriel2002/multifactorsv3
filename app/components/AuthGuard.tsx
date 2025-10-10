'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase/client'
import { checkAuthentication, AuthResult } from '@/app/utils/auth-guard'
import { ensureStableSession } from '@/app/utils/session-utils'
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
  const [authState, setAuthState] = useState<AuthResult>({
    isAuthenticated: false,
    user: null,
    profile: null,
    loading: true,
    error: null
  })
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const initialCheckDone = useRef(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      console.log('AuthGuard - Checking authentication...')
      
      // Wait longer for OAuth sessions to be established
      if (!initialCheckDone.current) {
        console.log('AuthGuard - Initial check, waiting for session...')
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      const result = await checkAuthentication(requiredRole)
      console.log('AuthGuard - Auth check result:', {
        isAuthenticated: result.isAuthenticated,
        hasUser: !!result.user,
        hasProfile: !!result.profile,
        profileStatus: result.profile?.status,
        error: result.error
      })
      
      if (!mounted) return
      
      initialCheckDone.current = true
      setAuthState(result)
      
      // Only set redirect flag if authentication fails after initial check
      if (!result.isAuthenticated && !result.loading) {
        console.log('AuthGuard - Authentication failed, will redirect in 2 seconds')
        
        // Give more time for OAuth sessions to establish
        redirectTimeoutRef.current = setTimeout(() => {
          if (mounted) {
            setShouldRedirect(true)
          }
        }, 2000)
      } else {
        // Clear any pending redirects if authentication succeeds
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current)
        }
        setShouldRedirect(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthGuard - Auth state changed:', event, 'Session:', !!session)
      
      if (!mounted) return
      
      if (event === 'SIGNED_OUT') {
        setAuthState({
          isAuthenticated: false,
          user: null,
          profile: null,
          loading: false,
          error: 'Session expired'
        })
        setShouldRedirect(true)
      } else if (event === 'SIGNED_IN' && session) {
        console.log('AuthGuard - User signed in, ensuring stable session...')
        
        // Wait a bit for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (!mounted) return
        
        console.log('AuthGuard - Re-checking authentication after sign in')
        const result = await checkAuthentication(requiredRole)
        
        if (!mounted) return
        
        setAuthState(result)
        
        if (!result.isAuthenticated) {
          console.log('AuthGuard - Authentication failed after sign in')
          setShouldRedirect(true)
        } else {
          console.log('AuthGuard - Authentication successful!')
          setShouldRedirect(false)
          // Clear any pending redirects
          if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current)
          }
        }
      } else if (event === 'INITIAL_SESSION' && session) {
        console.log('AuthGuard - Initial session detected, waiting for session to stabilize...')
        
        // Wait longer for initial session to be fully established
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        if (!mounted) return
        
        console.log('AuthGuard - Re-checking authentication after initial session')
        const result = await checkAuthentication(requiredRole)
        
        if (!mounted) return
        
        setAuthState(result)
        
        if (result.isAuthenticated) {
          console.log('AuthGuard - Initial session authentication successful!')
          setShouldRedirect(false)
          // Clear any pending redirects
          if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current)
          }
        } else {
          console.log('AuthGuard - Initial session authentication failed')
          setShouldRedirect(true)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [requiredRole])

  // Handle redirect in separate useEffect
  useEffect(() => {
    if (shouldRedirect && !authState.loading) {
      console.log('AuthGuard - Redirecting to login page')
      router.push('/')
    }
  }, [shouldRedirect, authState.loading, router])

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

  // Show custom fallback if provided and not authenticated
  if (fallback && !authState.isAuthenticated) {
    return <>{fallback}</>
  }

  // Render children only if authenticated
  if (authState.isAuthenticated && authState.user) {
    console.log('AuthGuard - User authenticated, rendering protected content')
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