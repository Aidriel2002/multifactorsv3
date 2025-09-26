// utils/minimal-auth-helpers.ts
import { supabase } from '@/app/lib/supabase/client'

/**
 * Ultra-minimal last active tracking that barely affects performance
 */
export const setupMinimalLastActiveTracking = () => {
  // Prevent multiple instances
  if (window.__minimalTrackingActive) return

  let lastUpdate = 0
  let userId: string | null = null

  // Simple update function that doesn't wait for response
  const updateLastActive = () => {
    if (!userId) return

    // Fire and forget - don't wait for response
    supabase 
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)
  }

  // Only update on login and every 10 minutes of activity
  const handleUpdate = () => {
    const now = Date.now()
    
    // Only update every 10 minutes maximum
    if (now - lastUpdate < 600000) return
    
    lastUpdate = now
    updateLastActive()
  }

  // Listen for auth changes only
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      userId = session.user.id
      handleUpdate() // Update on login
    } else if (event === 'SIGNED_OUT') {
      userId = null
    }
  })

  // Set up user if already logged in
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      userId = user.id
      handleUpdate()
    }
  })

  // Only track meaningful activity - single click event with heavy throttling
  let activityTimeout: NodeJS.Timeout | null = null
  const handleActivity = () => {
    if (!userId) return
    
    if (activityTimeout) return // Already scheduled
    
    activityTimeout = setTimeout(() => {
      handleUpdate()
      activityTimeout = null
    }, 600000) // Only update after 10 minutes of activity
  }

  // Single event listener
  document.addEventListener('click', handleActivity, { passive: true })

  window.__minimalTrackingActive = true

  // Cleanup
  return () => {
    authListener.subscription.unsubscribe()
    document.removeEventListener('click', handleActivity)
    if (activityTimeout) clearTimeout(activityTimeout)
    window.__minimalTrackingActive = false
  }
}

declare global {
  interface Window {
    __minimalTrackingActive?: boolean
  }
}