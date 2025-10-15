import { supabase } from '@/app/lib/supabase/client'

/**
 * Refresh the current session to ensure it's up to date
 */
export const refreshSession = async (): Promise<{ success: boolean; session: any; user: any; error?: string }> => {
  try {
    
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      return {
        success: false,
        session: null,
        user: null,
        error: error.message
      }
    }
    
    if (data.session && data.user) {
      return {
        success: true,
        session: data.session,
        user: data.user
      }
    }
    
    return {
      success: false,
      session: null,
      user: null,
      error: 'No session data after refresh'
    }
  } catch (error) {
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
    
    // First try to refresh the session
    const refreshResult = await refreshSession()
    
    if (refreshResult.success) {
      return refreshResult
    }
    
    // If refresh failed, wait a bit and try to get the current session
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return {
        success: false,
        session: null,
        user: null,
        error: error.message
      }
    }
    
    if (session?.user) {
      return {
        success: true,
        session,
        user: session.user
      }
    }
    
    return {
      success: false,
      session: null,
      user: null,
      error: 'No session found after force refresh'
    }
  } catch (error) {
    return {
      success: false,
      session: null,
      user: null,
      error: 'Unexpected error during force refresh'
    }
  }
}
