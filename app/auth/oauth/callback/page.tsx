"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase/client"
import { useRouter } from "next/navigation"
import { createActivityLog } from '@/app/lib/supabase/activityLogs'

// Ensure a profile exists for OAuth users
const ensureProfile = async (user: any) => {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (existingProfile) {
    console.log('Existing profile found:', existingProfile)
    
    // Update profile with latest OAuth data if needed
    const userMetadata = user.user_metadata || {}
    const fullName = userMetadata.full_name || userMetadata.name || ''
    const firstName = userMetadata.first_name || userMetadata.given_name || fullName.split(' ')[0] || ''
    const lastName = userMetadata.last_name || userMetadata.family_name || fullName.split(' ').slice(1).join(' ') || ''
    
    const updates: any = {
      updated_at: new Date().toISOString()
    }
    
    // Update names if missing
    if (!existingProfile.first_name || !existingProfile.last_name) {
      updates.first_name = firstName
      updates.last_name = lastName
      updates.full_name = fullName
    }
    
    // Update avatar if missing
    if (!existingProfile.avatar_url && (userMetadata.avatar_url || userMetadata.picture)) {
      updates.avatar_url = userMetadata.avatar_url || userMetadata.picture
    }
    
    // If there are updates, apply them
    if (Object.keys(updates).length > 1) { // More than just updated_at
      console.log('Updating existing profile with:', updates)
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
    }
    
    return existingProfile
  }

  // Extract names from user metadata
  const userMetadata = user.user_metadata || {}
  const fullName = userMetadata.full_name || userMetadata.name || ''
  const firstName = userMetadata.first_name || userMetadata.given_name || fullName.split(' ')[0] || ''
  const lastName = userMetadata.last_name || userMetadata.family_name || fullName.split(' ').slice(1).join(' ') || ''
  
  console.log('Creating new profile with OAuth data:', {
    email: user.email,
    firstName,
    lastName,
    fullName,
    metadata: userMetadata
  })

  // Auto-approve OAuth users since they're verified by Google
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      status: "approved", // ← Changed from "pending" to "approved"
      role: "staff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating profile:", error)
    throw error
  }

  console.log("Profile created successfully:", data)
  return data
}

// Check approval
const checkUserApproval = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: "No user found" }
    }

    const profile = await ensureProfile(user)

    if (!profile) {
      return { success: false, message: "Profile could not be created" }
    }

    console.log('Profile status:', profile.status)

    // Check status as string
    if (profile.status === "pending") {
      return { success: false, message: "Your account is pending admin approval." }
    }

    if (profile.status === "rejected") {
      return { success: false, message: "Your account has been rejected. Please contact admin." }
    }

    if (profile.status !== "approved") {
      return { success: false, message: "Unknown account status. Please contact support." }
    }

    return { success: true, profile }
  } catch (error) {
    console.error('Error in checkUserApproval:', error)
    return { success: false, message: "Error checking account status" }
  }
}

// Update last_active
const updateLastActive = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("id", user.id)
    }
  } catch (error) {
    console.error('Error updating last_active:', error)
  }
}

export default function OAuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('OAuth callback - Starting authentication check...')
        
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError("Authentication failed. Please try again.")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        if (!session?.user) {
          console.error('No session or user found')
          setError("No session found. Please try logging in again.")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        console.log('OAuth user logged in:', session.user)
        console.log('User metadata:', session.user.user_metadata)

        // Wait a bit for the session to be fully established
        console.log('Waiting for session to stabilize...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Ensure profile exists and check approval
        const statusCheck = await checkUserApproval()
        
        console.log('Status check result:', statusCheck)
        
        if (!statusCheck.success) {
          console.error('Status check failed:', statusCheck.message)
          await supabase.auth.signOut()
          setError(statusCheck.message)
          setTimeout(() => router.push("/"), 5000)
          return
        }

        console.log('User approved! Updating last active and logging activity...')

        // Update last active
        await updateLastActive()
        
        // Log activity
        try {
          await createActivityLog({
            userId: session.user.id,
            action: 'Logged in',
            details: 'User successfully authenticated via OAuth',
          })
        } catch (e) {
          console.warn('Failed to record login activity', e)
        }

        // Wait a bit more to ensure session is fully established
        console.log('Final wait before redirect...')
        await new Promise(resolve => setTimeout(resolve, 500))

        console.log('Redirecting to dashboard...')
        router.push("/multifactors/dashboard")
        
      } catch (err) {
        console.error("OAuth callback error:", err)
        setError("An unexpected error occurred.")
        setTimeout(() => router.push("/"), 3000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your account...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-2">{error}</p>
            <p className="text-red-600 text-sm">Redirecting...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}