import { supabase } from '@/app/lib/supabase/client'

/**
 * Wait for session to be established (useful for OAuth flows)
 */
export const waitForSession = async (maxWaitTime = 5000): Promise<{ session: any; user: any } | null> => {
  const startTime = Date.now()
  
  console.log('🔍 SessionUtils - Waiting for session to be established...')
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('🔍 SessionUtils - Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message
      })
      
      if (!error && session?.user) {
        console.log('🔍 SessionUtils - Session found:', session.user.email)
        return { session, user: session.user }
      }
      
      // Wait 500ms before trying again
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.warn('🔍 SessionUtils - Error checking session:', error)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log('🔍 SessionUtils - Session wait timeout')
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
        console.error('Session error:', error)
        if (i === retries - 1) {
          return { isAuthenticated: false, user: null, error: error.message }
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      
      if (session && user) {
        console.log('User authenticated:', user.email)
        return { isAuthenticated: true, user }
      }
      
      // If no session found, wait and retry
      if (i < retries - 1) {
        console.log(`No session found, retrying... (${i + 1}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('Authentication check error:', error)
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
    console.log('🔍 SessionUtils - Ensuring stable session...')
    
    // Wait for session to be established
    const sessionResult = await waitForSession(5000)
    
    if (!sessionResult) {
      console.log('🔍 SessionUtils - No stable session found')
      return false
    }
    
    console.log('🔍 SessionUtils - Session found, waiting for stabilization...')
    
    // Wait a bit more to ensure session is fully stable
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verify session is still there
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('🔍 SessionUtils - Session disappeared after stabilization')
      return false
    }
    
    console.log('🔍 SessionUtils - Session is stable:', session.user.email)
    return true
  } catch (error) {
    console.error('🔍 SessionUtils - Error ensuring stable session:', error)
    return false
  }
}
