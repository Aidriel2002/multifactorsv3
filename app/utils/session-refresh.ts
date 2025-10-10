import { supabase } from '@/app/lib/supabase/client'

/**
 * Refresh the current session to ensure it's up to date
 */
export const refreshSession = async (): Promise<{ success: boolean; session: any; user: any; error?: string }> => {
  try {
    console.log('🔄 SessionRefresh - Refreshing session...')
    
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.log('🔄 SessionRefresh - Error refreshing session:', error.message)
      return {
        success: false,
        session: null,
        user: null,
        error: error.message
      }
    }
    
    if (data.session && data.user) {
      console.log('🔄 SessionRefresh - Session refreshed successfully:', data.user.email)
      return {
        success: true,
        session: data.session,
        user: data.user
      }
    }
    
    console.log('🔄 SessionRefresh - No session data after refresh')
    return {
      success: false,
      session: null,
      user: null,
      error: 'No session data after refresh'
    }
  } catch (error) {
    console.error('🔄 SessionRefresh - Unexpected error:', error)
    return {
      success: false,
      session: null,
      user: null,
      error: 'Unexpected error during session refresh'
    }
  }
}

/**
 * Force a session refresh and wait for it to complete
 */
export const forceSessionRefresh = async (maxWaitTime = 5000): Promise<{ success: boolean; session: any; user: any; error?: string }> => {
  try {
    console.log('🔄 SessionRefresh - Force refreshing session...')
    
    // First try to refresh the session
    const refreshResult = await refreshSession()
    
    if (refreshResult.success) {
      return refreshResult
    }
    
    // If refresh failed, wait a bit and try to get the current session
    console.log('🔄 SessionRefresh - Refresh failed, waiting for session to stabilize...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('🔄 SessionRefresh - Error getting session after refresh:', error.message)
      return {
        success: false,
        session: null,
        user: null,
        error: error.message
      }
    }
    
    if (session?.user) {
      console.log('🔄 SessionRefresh - Session found after wait:', session.user.email)
      return {
        success: true,
        session,
        user: session.user
      }
    }
    
    console.log('🔄 SessionRefresh - No session found after force refresh')
    return {
      success: false,
      session: null,
      user: null,
      error: 'No session found after force refresh'
    }
  } catch (error) {
    console.error('🔄 SessionRefresh - Unexpected error during force refresh:', error)
    return {
      success: false,
      session: null,
      user: null,
      error: 'Unexpected error during force refresh'
    }
  }
}
