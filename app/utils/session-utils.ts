import { supabase } from '@/app/lib/supabase/client'

/**
 * Wait for session to be established (useful for OAuth flows)
 */
export const waitForSession = async (maxWaitTime = 5000): Promise<{ session: any; user: any } | null> => {
  const startTime = Date.now()
  
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      
      if (!error && session?.user) {
        return { session, user: session.user }
      }
      
      // Wait 500ms before trying again
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return null
}

/**
 * Check if user is authenticated with retry logic
 */
export const checkUserAuthentication = async (retries = 3): Promise<{ isAuthenticated: boolean; user: any; error?: string }> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data: { session, user }, error } = await supabase.auth.getSession()
      
      if (error) {
        if (i === retries - 1) {
          return { isAuthenticated: false, user: null, error: error.message }
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      
      if (session && user) {
        return { isAuthenticated: true, user }
      }
      
      // If no session found, wait and retry
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      if (i === retries - 1) {
        return { isAuthenticated: false, user: null, error: 'Authentication check failed' }
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return { isAuthenticated: false, user: null, error: 'No session found after retries' }
}

/**
 * Ensure session is stable before proceeding
 */
export const ensureStableSession = async (): Promise<boolean> => {
  try {
    
    // Wait for session to be established
    const sessionResult = await waitForSession(5000)
    
    if (!sessionResult) {
      return false
    }
    
    
    // Wait a bit more to ensure session is fully stable
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verify session is still there
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}
