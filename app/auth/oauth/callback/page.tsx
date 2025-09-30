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
    // If profile exists but missing names, update it
    if (!existingProfile.first_name || !existingProfile.last_name) {
      const userMetadata = user.user_metadata || {}
      const fullName = userMetadata.full_name || userMetadata.name || ''
      const firstName = userMetadata.first_name || userMetadata.given_name || fullName.split(' ')[0] || ''
      const lastName = userMetadata.last_name || userMetadata.family_name || fullName.split(' ').slice(1).join(' ') || ''
      
      console.log('Updating existing profile with names:', { firstName, lastName })
      
      await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          avatar_url: userMetadata.avatar_url || userMetadata.picture || existingProfile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)
    }
    
    return existingProfile
  }

  // Extract names from user metadata
  const userMetadata = user.user_metadata || {}
  const fullName = userMetadata.full_name || userMetadata.name || ''
  const firstName = userMetadata.first_name || userMetadata.given_name || fullName.split(' ')[0] || ''
  const lastName = userMetadata.last_name || userMetadata.family_name || fullName.split(' ').slice(1).join(' ') || ''
  
  console.log('Creating new profile with Google data:', {
    email: user.email,
    firstName,
    lastName,
    fullName,
    metadata: userMetadata
  })

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      status: "pending",
      role: "staff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating profile:", error)
    return null
  }

  console.log("Profile created successfully:", data)
  return data
}

// Check approval
const checkUserApproval = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "No user found" }

  const profile = await ensureProfile(user)

  if (!profile) {
    return { success: false, message: "Profile could not be created" }
  }

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

  return { success: true }
}

// Update last_active
const updateLastActive = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", user.id)
  }
}

export default function OAuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) {
          setError("Authentication failed. Please try again.")
          setTimeout(() => router.push("/auth/login"), 3000)
          return
        }

        console.log('OAuth user logged in:', session.user)
        console.log('User metadata:', session.user.user_metadata)

        const statusCheck = await checkUserApproval()
        if (!statusCheck.success) {
          await supabase.auth.signOut()
          setError(statusCheck.message)
          setTimeout(() => router.push("/"), 5000)
          return
        }

        await updateLastActive()
        try {
          const user = session.user
          await createActivityLog({
            userId: user.id,
            action: 'Logged in',
            details: 'User successfully authenticated via OAuth',
          })
        } catch (e) {
          console.warn('Failed to record login activity', e)
        }
        router.push("/multifactors")
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

  if (loading) return <div className="p-6 text-center">Checking your account...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  return null
}